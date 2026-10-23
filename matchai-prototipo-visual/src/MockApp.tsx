"use client";

import { useEffect, useRef, useState, type FormEvent, type PointerEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft, ArrowRight, Bell, Check, ChevronDown, CircleHelp, Sparkles, TrendingUp, Zap,
  FileText, Heart, House, Image as ImageIcon, Medal, Pencil, Plus,
  Send, Trophy, Upload, UserRound, X,
  type LucideIcon,
} from "lucide-react";

export type DemoScreen = "login" | "cadastro" | "feed" | "publicar" | "ranking" | "alertas" | "perfil";
type Guess = "ai" | "human";
type PostType = "foto" | "video" | "audio" | "texto";
type Post = { id: number; title: string; author: string; kind: PostType; source: Guess; image?: string; text?: string };
type CreatedPost = Pick<Post, "title" | "kind" | "source"> & { text: string };
type DemoStore = { points: number; evaluated: number; correct: number; published: number; readAlerts: boolean; created: CreatedPost | null };
const INITIAL: DemoStore = { points: 0, evaluated: 0, correct: 0, published: 0, readAlerts: false, created: null };
const STORAGE_KEY = "matchai-demo-v2";

const SEED_POSTS: Post[] = [
  { id: 1, title: "Retrato Futurista", author: "@digital.dreams", kind: "foto", source: "ai", image: "/demo/retrato-futurista.svg" },
  { id: 2, title: "Memória de Família", author: "@memorias", kind: "texto", source: "human", text: "Hoje minha avó me ensinou a fazer pão pela primeira vez. Ela disse que a massa precisa sentir as suas mãos. Nunca entendi tanto o que é amor como naquele momento." },
  { id: 3, title: "Cidade ao Entardecer", author: "@synthetic.eye", kind: "foto", source: "ai", image: "/demo/cidade-sintetica.svg" },
  { id: 4, title: "Tarde na Praia", author: "@litoral.real", kind: "foto", source: "human", image: "/demo/praia-real.svg" },
  { id: 5, title: "Cidade em Movimento", author: "@frame.synthetic", kind: "video", source: "ai", image: "/demo/cidade-sintetica.svg" },
  { id: 6, title: "Voz da Madrugada", author: "@ondas.sonoras", kind: "audio", source: "human", text: "Uma breve gravação de áudio de um passeio na orla, com sons do mar." },
];

const INITIAL_COMMENTS = [
  { name: "Rafael S.", avatar: "R", when: "2h", text: "Deu pra ver pelos olhos — perfeitos demais pra ser real!", likes: 24 },
  { name: "Carla M.", avatar: "C", when: "3h", text: "Não sabia que IA chegava nesse nível 😱 Errei feio haha", likes: 18 },
  { name: "Diego L.", avatar: "D", when: "5h", text: "A textura entrega tudo. Falta a imperfeição humana", likes: 31 },
  { name: "Ana P.", avatar: "A", when: "6h", text: "Acertei! A iluminação era uniforme demais pra ser foto real", likes: 12 },
  { name: "Lucas T.", avatar: "L", when: "8h", text: "Errei os últimos 3 kkk esse aqui tava muito bom mesmo", likes: 8 },
  { name: "Fernanda R.", avatar: "F", when: "10h", text: "O background com aquela névoa é sinal claro de Midjourney", likes: 19 },
];

function Brand({ compact = false }: { compact?: boolean }) {
  return <Link className="ma-brand" to="/demo/feed" aria-label="MatchAI: ir ao feed">
    <img src="/demo/matchai-mark.svg" alt="" width={compact ? 26 : 30} height={compact ? 26 : 30} />
    <span>Match<span className="ma-brand-yellow">AI</span></span>
  </Link>;
}

function DemoTag() { return <span className="ma-demo-tag" title="Tela visual sem API real">DEMO</span>; }

function BottomNav({ screen }: { screen: DemoScreen }) {
  const items: { screen: DemoScreen; label: string; icon: LucideIcon }[] = [
    { screen: "feed", label: "Início", icon: House },
    { screen: "publicar", label: "Publicar", icon: Plus },
    { screen: "ranking", label: "Ranking", icon: Trophy },
    { screen: "alertas", label: "Alertas", icon: Bell },
    { screen: "perfil", label: "Perfil", icon: UserRound },
  ];
  return <nav className="ma-bottom-nav" aria-label="Navegação principal do MatchAI">
    {items.map(({ screen: key, label, icon: Icon }) => <Link key={key} to={`/demo/${key}`}
      className={`ma-nav-item ${screen === key ? "is-active" : ""}`}
      aria-current={screen === key ? "page" : undefined}>
      <Icon size={19} strokeWidth={screen === key ? 2.8 : 2} />
      <span>{label}</span>
      {screen === key && <span className="ma-active-dot" />}
    </Link>)}
  </nav>;
}

function AuthPage({ screen }: { screen: "login" | "cadastro" }) {
  const navigate = useNavigate();
  const isLogin = screen === "login";
  const [message, setMessage] = useState("");
  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage(isLogin ? "Login simulado: nenhuma conta foi autenticada." : "Cadastro simulado: nenhum e-mail foi enviado.");
    window.setTimeout(() => navigate("/demo/feed"), 650);
  }
  return <section className="ma-auth-page">
    {isLogin ? <Brand /> : <Link to="/demo/login" className="ma-back"><ArrowLeft size={17} /> Voltar</Link>}
    <div className="ma-auth-heading">
      <h1>{isLogin ? <>Bem-vindo<br />de volta!</> : "Criar conta"}</h1>
      <p>{isLogin ? "Faça login para continuar" : "Comece a identificar IAs!"}</p>
    </div>
    <form className="ma-auth-form" onSubmit={submit}>
      {!isLogin && <label>Nome de usuário<input required minLength={3} placeholder="exemplo: AIHunter99" autoComplete="username" /></label>}
      <label>E-mail<input required type="email" placeholder="seu@email.com" autoComplete="email" /></label>
      <label>Senha<input required minLength={8} type="password" placeholder="••••••••" autoComplete={isLogin ? "current-password" : "new-password"} /></label>
      {isLogin && <Link to="/demo/login" className="ma-forgot" onClick={(e) => { e.preventDefault(); setMessage("Recuperação de senha será integrada à API de autenticação."); }}>Esqueci a senha</Link>}
      <button className="ma-btn ma-btn-primary" type="submit">{isLogin ? "Entrar" : "Criar conta"}</button>
      {message && <p className="ma-form-message" role="status">{message}</p>}
    </form>
    {isLogin ? <div className="ma-auth-tail"><div className="ma-divider-label">ou</div>
      <Link to="/demo/cadastro" className="ma-btn ma-btn-outline">Criar conta</Link>
      <Link className="ma-try-demo" to="/demo/feed">Explorar protótipo sem login <ArrowRight size={14} /></Link>
    </div> : <p className="ma-legal">Ao criar conta, você concorda com os Termos de Uso e a Política de Privacidade do MatchAI.</p>}
  </section>;
}

function Avatar({ name, color }: { name: string; color?: string }) {
  return <span className="ma-avatar" style={{ background: color || "#292a2d" }}>{name}</span>;
}

function FeedPage({ store, setStore }: { store: DemoStore; setStore: (fn: (s: DemoStore) => DemoStore) => void }) {
  const customPost = store.created ? [{ id: 1000, title: store.created.title, kind: store.created.kind, author: "@novo.usuario", source: store.created.source, text: store.created.text } as Post] : [];
  const posts = [...customPost, ...SEED_POSTS];
  const [index, setIndex] = useState(0);
  const [guess, setGuess] = useState<Guess | null>(null);
  const [offset, setOffset] = useState(0);
  const pointerStart = useRef<number | null>(null);
  const [commentText, setCommentText] = useState("");
  const [comments, setComments] = useState(INITIAL_COMMENTS);
  const [likes, setLikes] = useState<number[]>([]);
  const [expand, setExpand] = useState(false);
  const post = posts[index % posts.length];
  const success = guess === post.source;
  const score = success ? 10 : 0;

  function vote(choice: Guess) {
    if (guess) return;
    setGuess(choice);
    setOffset(0);
    setStore(s => ({ ...s, evaluated: s.evaluated + 1, correct: s.correct + Number(choice === post.source), points: s.points + (choice === post.source ? 10 : 0) }));
  }
  function next() { setIndex(i => i + 1); setGuess(null); setOffset(0); setExpand(false); setComments(INITIAL_COMMENTS); setLikes([]); setCommentText(""); }
  function startPointer(e: PointerEvent<HTMLDivElement>) {
    if (guess) return;
    if ((e.target as HTMLElement).closest("button, a")) return;
    pointerStart.current = e.clientX;
    e.currentTarget.setPointerCapture(e.pointerId);
  }
  function movePointer(e: PointerEvent<HTMLDivElement>) {
    if (pointerStart.current === null || guess) return;
    setOffset(Math.max(-250, Math.min(250, e.clientX - pointerStart.current)));
  }
  function endPointer(e: PointerEvent<HTMLDivElement>) {
    if (pointerStart.current === null) return;
    const delta = e.clientX - pointerStart.current;
    pointerStart.current = null;
    setOffset(0);
    if (Math.abs(delta) > 85) vote(delta > 0 ? "ai" : "human");
  }
  function sendComment(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!commentText.trim()) return;
    setComments(items => [{ name: "Você", avatar: "V", when: "agora", text: commentText.trim(), likes: 0 }, ...items]);
    setCommentText("");
  }
  return <div className="ma-feed-screen">
    <header className="ma-feed-header">
      <Link to="/demo/perfil" className="ma-user-summary"><Avatar name="N" color="#9b6f57"/><span><strong>INICIANTE</strong><small>Fraco — em evolução</small></span></Link>
      <div className="ma-points"><strong>{store.points}</strong><small>PONTOS</small></div>
    </header>
    <div className="ma-guess-actions"><button onClick={() => vote("human")} disabled={!!guess} className="ma-guess-btn human"><ArrowLeft size={14}/> HUMANO</button><span>ARRASTE</span><button onClick={() => vote("ai")} disabled={!!guess} className="ma-guess-btn ai">IA <ArrowRight size={14}/></button></div>
    <div className={`ma-swipe-area ${guess ? "is-revealed" : ""}`}>
      <div className={`ma-post-card ${guess ? "has-result" : ""}`}
        onPointerDown={startPointer} onPointerMove={movePointer} onPointerUp={endPointer} onPointerCancel={() => {pointerStart.current = null; setOffset(0)}}
        style={{ transform: guess ? "none" : `translateX(${offset}px) rotate(${offset / 22}deg)`, cursor: guess ? "default" : "grab" }}>
        <div className={`ma-post-visual ${post.kind === "texto" ? "is-text" : ""}`}>
          {post.image ? <img className="ma-art" src={post.image} alt={`Arte ilustrativa: ${post.title}`} draggable={false}/> :
            <div className="ma-text-art">{post.kind === "audio" ? <div className="ma-sound-bars" aria-hidden="true">{[32,48,26,72,54,86,40,66,28,78,50,33,65,40,58,24,38,57,31].map((h,i)=><i key={i} style={{height:`${h}%`}}/>)}</div> : <FileText size={22}/>}<p>{post.text || "Este é um conteúdo de demonstração publicado pela comunidade."}</p></div>}
          {!guess && <><div className="ma-post-shade"/><div className="ma-post-info"><div><strong>{post.title}</strong><small>{post.author}</small></div><span className="ma-type-pill">{post.kind === "foto" ? <ImageIcon size={11}/> : <FileText size={11}/>} {post.kind.toUpperCase()}</span></div></>}
          {!guess && offset !== 0 && <span className={`ma-floating-guess ${offset > 0 ? "ai" : "human"}`}>{offset > 0 ? "IA" : "HUMANO"}</span>}
          {guess && <div className="ma-result">
            <div className={`ma-result-icon ${success ? "correct" : "wrong"}`}>{success ? <Check size={31}/> : <X size={31}/>}</div>
            <div className="ma-result-row"><div><h2 className={success ? "ma-success" : "ma-error"}>{success ? "ACERTOU!" : "ERROU..."}</h2><small>{post.title}</small></div><div className="ma-actually"><span>ERA</span><strong>{post.source === "ai" ? "IA" : "HUMANO"}</strong></div></div>
            <div className="ma-result-meter"><div><span>PONTUAÇÃO</span><b>{score}</b></div><div className="ma-result-meter-right"><strong>{success ? "MEDIANO" : "INICIANTE"}</strong><span>50% de acerto</span><div className="ma-progress"><i style={{width: success ? "50%" : "4%"}}/></div></div></div>
            <button type="button" className="ma-next-on-card" onClick={next}>Próximo conteúdo →</button>
          </div>}
        </div>
      </div>
    </div>
    {!guess ? <div className="ma-feed-hints"><div className="ma-streak">— <b>{store.correct}</b> SEQUÊNCIA</div><div className="ma-feed-totals"><span><b>{store.evaluated}</b>AVALIADOS</span><span><b>{store.correct}</b>ACERTOS</span><span><b>{store.evaluated - store.correct}</b>ERROS</span></div><p>Deslize o cartão ou use os botões para responder.</p></div>
      : <><button className="ma-comments-toggle" onClick={() => setExpand(!expand)}>COMENTÁRIOS <ChevronDown size={13} className={expand ? "ma-up" : ""}/></button>
        <section className={`ma-comments ${expand ? "expanded" : ""}`}>
          <div className="ma-comments-heading"><h3>Comentários</h3><span>{comments.length}</span></div>
          <form className="ma-comment-form" onSubmit={sendComment}><Avatar name="V" color="#3a81f5"/><input value={commentText} onChange={e => setCommentText(e.target.value)} placeholder="Adicionar comentário..." aria-label="Adicionar comentário"/><button type="submit" aria-label="Enviar comentário"><Send size={16}/></button></form>
          {comments.map((comment, i) => <article className="ma-comment" key={`${comment.name}-${i}`}><Avatar name={comment.avatar}/><div className="ma-comment-content"><div><strong>{comment.name}</strong><time>{comment.when}</time></div><p>{comment.text}</p><button onClick={() => setLikes(a => a.includes(i) ? a.filter(v => v !== i) : [...a,i])} className={likes.includes(i) ? "is-liked" : ""}><Heart size={13} fill={likes.includes(i) ? "currentColor" : "none"}/> {comment.likes + Number(likes.includes(i))}</button></div></article>)}
          <button className="ma-next-button" onClick={next}>Próximo conteúdo <ArrowRight size={15}/></button>
        </section></>}
  </div>;
}

function PublishPage({ setStore }: { setStore: (fn: (s: DemoStore) => DemoStore) => void }) {
  const navigate = useNavigate();
  const [kind, setKind] = useState<PostType>("foto");
  const [source, setSource] = useState<Guess>("ai");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  function publish(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!title.trim()) return setError("Informe um título.");
    if (kind === "texto" && !description.trim()) return setError("Informe o conteúdo textual.");
    if (kind !== "texto" && !file) return setError("Escolha um arquivo para simular o envio.");
    setStore(s => ({ ...s, published: s.published + 1, created: { title: title.trim(), kind, source, text: description.trim() || "Prévia de mídia criada apenas no navegador." } }));
    navigate("/demo/feed");
  }
  return <section className="ma-page ma-publish-page"><PageHeading title="Publicar Conteúdo" subtitle="Compartilhe para a comunidade avaliar"/>
    <form onSubmit={publish} className="ma-publish-form">
      <label className="ma-upload-target"><input key={kind} type="file" accept={kind === "foto" ? "image/png,image/jpeg,image/webp" : kind === "video" ? "video/mp4,video/webm" : kind === "audio" ? "audio/mpeg,audio/wav,audio/ogg" : undefined} onChange={e => setFile(e.target.files?.[0] ?? null)} disabled={kind === "texto"}/><span><Upload size={25}/></span><strong>{kind === "texto" ? "Conteúdo em texto" : file?.name || "Adicionar arquivo"}</strong><small>{kind === "texto" ? "Digite o texto na descrição" : "Foto, vídeo ou áudio"}</small></label>
      <div className="ma-field-title">TIPO DE CONTEÚDO</div>
      <div className="ma-kind-options">{(["foto","video","audio","texto"] as PostType[]).map(k => <button type="button" key={k} className={kind === k ? "active" : ""} onClick={() => {setKind(k);setFile(null);setError("")}}>{k === "video" ? "VÍDEO" : k === "audio" ? "ÁUDIO" : k.toUpperCase()}</button>)}</div>
      <label className="ma-input-label">TÍTULO<input required maxLength={90} placeholder="Dê um nome ao conteúdo" value={title} onChange={e=>setTitle(e.target.value)}/></label>
      <label className="ma-input-label">{kind === "texto" ? "CONTEÚDO" : "DESCRIÇÃO (OPCIONAL)"}<textarea rows={4} placeholder={kind === "texto" ? "Escreva seu conteúdo..." : "Contexto adicional..."} value={description} onChange={e=>setDescription(e.target.value)}/></label>
      <div className="ma-field-title">ESTE CONTEÚDO É</div>
      <div className="ma-source-options"><button type="button" className={source === "ai" ? "selected" : ""} onClick={() => setSource("ai")}><span>🤖</span><strong>IA</strong><small>Gerado por IA</small></button><button type="button" className={source === "human" ? "selected" : ""} onClick={() => setSource("human")}><span>👤</span><strong>HUMANO</strong><small>Criado por pessoa</small></button></div>
      {error && <p className="ma-form-message" role="alert">{error}</p>}
      <button className="ma-btn ma-btn-primary" type="submit">Publicar demonstração</button>
      <p className="ma-fineprint">Esta tela simula a publicação. Nenhum arquivo é enviado ao servidor ou ao RustFS.</p>
    </form>
  </section>;
}

const SCORES = [
  { name: "LunaDetect", badge: "L", points: 2847, accuracy: 92, color: "#37ec18" },
  { name: "AIHunterX", badge: "A", points: 2634, accuracy: 89, color: "#31ed17" },
  { name: "SyntheticEye", badge: "S", points: 2401, accuracy: 87, color: "#ffb100" },
  { name: "TechMind", badge: "T", points: 2190, accuracy: 87, color: "#ffac07" },
  { name: "PixelDetector", badge: "P", points: 1980, accuracy: 82, color: "#c2cbd5" },
  { name: "DigitalNative", badge: "D", points: 1750, accuracy: 78, color: "#c5cdd9" },
  { name: "MediaAnalyst", badge: "M", points: 1200, accuracy: 65, color: "#a648eb" },
  { name: "StartHere", badge: "S", points: 980, accuracy: 61, color: "#a648eb" },
  { name: "NovoCriador", badge: "N", points: 450, accuracy: 42, color: "#3088ff" },
  { name: "Iniciante01", badge: "I", points: 120, accuracy: 35, color: "#95a6be" },
];
function PageHeading({title, subtitle}: {title:string;subtitle:string}) { return <header className="ma-page-heading"><div><h1>{title}</h1><p>{subtitle}</p></div><DemoTag/></header>; }

function RankingPage() {
  const podium = [SCORES[1],SCORES[0],SCORES[2]];
  return <section className="ma-page ma-ranking-page"><PageHeading title="Ranking Global" subtitle="Melhores identificadores de IA"/>
    <div className="ma-podium">{podium.map((p,i)=> <div key={p.name} className={`ma-podium-person place-${i}`}><div className="ma-podium-crown">{i === 1 ? "👑" : ""}</div><Avatar name={p.badge} color={p.color}/><strong>{p.name}</strong><span>{p.points.toLocaleString("pt-BR")} pts</span><div className="ma-podium-block"><Medal size={21} color={i===1 ? "#ffbe29" : i===0 ? "#abbccc" : "#c78e50"} /><b>{i === 1 ? 1 : i === 0 ? 2 : 3}</b></div></div>)}</div>
    <div className="ma-rank-list">{SCORES.slice(3).map((p,i)=><div className="ma-rank-row" key={p.name}><span className="ma-rank-number">{i + 4}</span><Avatar name={p.badge} color={p.color}/><div className="ma-rank-user"><strong>{p.name}</strong><small>● {p.accuracy >= 80 ? "Elite" : p.accuracy >= 60 ? "Bom" : "Mediano"} · {p.accuracy}% acertos</small></div><b>{p.points.toLocaleString("pt-BR")}</b></div>)}</div>
    <p className="ma-fineprint">Jogadores e pontuações fictícios para demonstrar a interface.</p>
  </section>;
}

const ALERTS = [
  {color:"#ffcf19",title:"Você acertou 5 seguidas! 🎯",detail:"Sequência incrível",time:"5min"},
  {color:"#398bff",title:"Seu conteúdo recebeu 12 avaliações",detail:'“Retrato Futurista” está bombando',time:"1h"},
  {color:"#398bff",title:"Você subiu para Rank Mediano 🔵",detail:"Continue assim para alcançar Bom",time:"2h"},
  {color:"#999ba3",title:"Novo conteúdo disponível",detail:"Foto viral com 4.2k avaliações",time:"3h"},
  {color:"#a647e9",title:"Diego L. comentou no seu post",detail:'“A textura da pele entrega tudo”',time:"5h"},
  {color:"#ffad17",title:"Você está no top 10%! 🏆",detail:"Só 320 usuários chegam aqui",time:"1d"},
];
function AlertsPage({store,setStore}: {store:DemoStore;setStore:(fn:(s:DemoStore)=>DemoStore)=>void}) {
  return <section className="ma-page ma-alerts-page"><header className="ma-page-heading"><div><h1>Notificações</h1><p>{store.readAlerts ? "Tudo lido" : "6 não lidas"}</p></div><button className="ma-mark-all" onClick={()=>setStore(s=>({...s,readAlerts:!s.readAlerts}))}>{store.readAlerts ? "Marcar não lidas" : "Marcar todas"}</button></header>
    <div className="ma-alert-list">{ALERTS.map((a,i)=><div key={i} className={`ma-alert ${store.readAlerts? "is-read":""}`}><span className="ma-alert-dot" style={{background:store.readAlerts ? "#555" : a.color}}/><div><strong>{a.title}</strong><p>{a.detail}</p></div><time>{a.time}</time></div>)}</div>
    <p className="ma-fineprint">As notificações são exemplos; nenhuma é enviada por um serviço externo.</p>
  </section>;
}

function ProfilePage({store}: {store:DemoStore}) {
  const pct = store.evaluated ? Math.round((store.correct / store.evaluated) * 100) : 50;
  return <section className="ma-page ma-profile-page"><div className="ma-profile-hero"><button className="ma-profile-edit" title="Edição disponível após autenticação real" onClick={()=>alert("Edição de perfil será conectada ao backend.")}><Pencil size={18}/></button><Avatar name="N" color="#3786ff"/><h1>Novo Usuário</h1><div className="ma-rank-chip">🔵 Mediano</div><DemoTag/></div>
    <div className="ma-stats-grid"><div><b>{store.points}</b><span>PONTOS</span></div><div><b>{store.correct}</b><span>ACERTOS</span></div><div><b>{store.published + 3}</b><span>CONTEÚDOS</span></div></div>
    <div className="ma-profile-box"><div className="ma-stat-label"><strong>Precisão geral</strong><b>{pct}%</b></div><div className="ma-progress"><i style={{width:`${pct}%`}}/></div><div className="ma-bar-scale"><span>0%</span><span>50%</span><span>100%</span></div></div>
    <div className="ma-profile-box"><div className="ma-stat-label"><strong>Progresso para próximo rank</strong><b>{Math.min(100,Math.round(store.points/35))}%</b></div><div className="ma-progress"><i style={{width:`${Math.min(100,Math.round(store.points/35))}%`}}/></div></div>
    <div className="ma-profile-box"><strong className="ma-profile-label">Histórico de Ranks</strong><div className="ma-levels"><span>🟤<small>Iniciante</small></span><span>⬜<small>Fraco</small></span><span className="active">🔵<small>Mediano</small></span><span>🟣<small>Bom</small></span><span>🟠<small>Elite</small></span><span>🏆<small>Lenda</small></span></div></div>
    <p className="ma-fineprint">Estatísticas armazenadas somente no navegador. Não representam uma conta real.</p>
    <Link to="/demo/login" className="ma-profile-logout">Voltar ao login da demonstração <ArrowRight size={14}/></Link>
  </section>;
}


const MAIN_ITEMS: {screen: DemoScreen; icon: LucideIcon; label:string}[] = [
  { screen:"feed",icon:House,label:"Explorar feed" },
  { screen:"publicar",icon:Plus,label:"Publicar conteúdo" },
  { screen:"ranking",icon:Trophy,label:"Ranking global" },
  { screen:"alertas",icon:Bell,label:"Notificações" },
  { screen:"perfil",icon:UserRound,label:"Meu perfil" },
];

function DesktopSidebar({ screen }: { screen: DemoScreen }) {
  return <aside className="ma-sidebar" aria-label="Navegação principal">
    <div className="ma-sidebar-top"><Brand /><span className="ma-rail-caption">Descubra o que é real.</span></div>
    <div className="ma-sidebar-menu-title">MENU PRINCIPAL</div>
    <nav className="ma-sidebar-links">
      {MAIN_ITEMS.map(({screen:key,icon:Icon,label})=><Link key={key} to={`/demo/${key}`} className={`ma-sidebar-link ${screen===key ? "is-active" : ""}`} aria-current={screen===key?"page":undefined}><Icon size={19} /><span>{label}</span>{key==="alertas"&&<i className="ma-unread-dot"/>}</Link>)}
    </nav>
    <div className="ma-sidebar-bottom">
      <div className="ma-side-help"><Sparkles size={18} /><div><strong>O desafio está lançado</strong><p>Você sabe distinguir uma criação humana de uma IA?</p></div></div>
      <div className="ma-mini-user"><Avatar name="N" color="#4488f9"/><div><strong>Novo Usuário</strong><small>Conta de demonstração</small></div><DemoTag /></div>
    </div>
  </aside>
}

function RightRail({store}:{store: DemoStore}) {
  const accuracy=store.evaluated ? Math.round(store.correct / store.evaluated * 100) : 0;
  return <aside className="ma-right-rail" aria-label="Resumo da demonstração">
    <div className="ma-rail-card ma-rail-welcome"><div className="ma-rail-overline"><Zap size={14}/> SEU DESEMPENHO</div><div className="ma-rail-big">{store.points.toLocaleString("pt-BR")} <span>pts</span></div><p>Continue avaliando para subir no ranking.</p><div className="ma-rail-mini-stats"><span><strong>{store.evaluated}</strong> avaliações</span><span><strong>{accuracy}%</strong> precisão</span></div><Link to="/demo/perfil" className="ma-rail-link">Ver estatísticas <ArrowRight size={14}/></Link></div>
    <div className="ma-rail-card"><div className="ma-rail-overline"><TrendingUp size={14}/> TOP JOGADORES</div>{SCORES.slice(0,3).map((p,i)=><div key={p.name} className="ma-rail-leader"><span>{String(i+1).padStart(2,"0")}</span><Avatar name={p.badge} color={p.color}/><strong>{p.name}</strong><b>{p.points.toLocaleString("pt-BR")}</b></div>)}<Link to="/demo/ranking" className="ma-rail-link">Ranking completo <ArrowRight size={14}/></Link></div>
    <div className="ma-rail-tip"><CircleHelp size={17}/><div><b>Como funciona?</b><p>Escolha HUMANO ou IA. Cada acerto vale 10 pontos. Tudo é simulado neste protótipo.</p></div></div>
  </aside>
}

function DesktopTopbar({ screen, store }: {screen:DemoScreen;store:DemoStore}) {
 const titles:Record<DemoScreen,string>={feed:"Explorar",publicar:"Publicar",ranking:"Ranking",alertas:"Notificações",perfil:"Meu perfil",login:"Entrar",cadastro:"Criar conta"};
 return <header className="ma-global-header"><div><div className="ma-breadcrumb">MATCHAI <span>/</span> {titles[screen]}</div><h1>{screen==="feed" ? "Você consegue identificar uma IA?" : titles[screen]}</h1></div><div className="ma-global-actions"><span className="ma-demo-global"><span/> Protótipo interativo</span><div className="ma-header-points"><Zap size={15}/><b>{store.points}</b> PTS</div><Link to="/demo/perfil" aria-label="Ir ao perfil"><Avatar name="N" color="#4089ff"/></Link></div></header>
}

export function MatchAIDemo({screen}: {screen:DemoScreen}) {
  const [store,setStoreState] = useState<DemoStore>(INITIAL);
  useEffect(()=> {
    try { const saved=localStorage.getItem(STORAGE_KEY); if(saved) setStoreState({...INITIAL,...JSON.parse(saved)} as DemoStore); } catch { /* localStorage opcional */ }
  },[]);
  function setStore(fn:(s:DemoStore)=>DemoStore) {
    setStoreState(current=> {
      const next=fn(current);
      try { localStorage.setItem(STORAGE_KEY,JSON.stringify(next)); } catch { /* armazenamento opcional */ }
      return next;
    });
  }
  const isAuth=screen==="login" || screen==="cadastro";
  return <div className={`ma-demo ma-app ${isAuth ? "is-auth" : ""}`}>
    {isAuth ? <>
      <div className="ma-auth-aside"><Brand/><div className="ma-auth-aside-copy"><span className="ma-eyebrow">O JOGO ENTRE O REAL E O SINTÉTICO</span><h1>A verdade<br/>está nos <em>detalhes.</em></h1><p>Fotos, vídeos, áudios e histórias. Será que você sabe o que foi criado por uma pessoa?</p><Link className="ma-auth-explore" to="/demo/feed">Explorar sem login <ArrowRight size={17}/></Link></div><div className="ma-auth-aside-footer">MATCHAI © 2026 · PROTÓTIPO ACADÊMICO</div></div>
      <main className="ma-auth-main"><div className="ma-auth-container">{screen==="login" ? <AuthPage screen="login"/> : <AuthPage screen="cadastro"/>}</div></main>
    </> : <>
      <DesktopSidebar screen={screen}/>
      <div className="ma-workspace">
        <DesktopTopbar screen={screen} store={store}/>
        <div className="ma-workspace-columns"><main className="ma-content" id="conteudo">
          {screen==="feed" && <FeedPage store={store} setStore={setStore}/>}
          {screen==="publicar" && <PublishPage setStore={setStore}/>}
          {screen==="ranking" && <RankingPage/>}
          {screen==="alertas" && <AlertsPage store={store} setStore={setStore}/>}
          {screen==="perfil" && <ProfilePage store={store}/>}
        </main><RightRail store={store}/></div>
      </div>
      <BottomNav screen={screen}/>
    </>}
  </div>;
}
