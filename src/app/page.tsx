import { prisma } from "@/lib/prisma";

export default async function HomePage() {
    const totalUsuarios = await prisma.sysUsuario.count({
        where: {
            ativo: 1,
            deleted_at: null,
        },
    });

    const totalAtleticas = await prisma.atlAtletica.count({
        where: {
            ativo: 1,
            deleted_at: null,
        },
    });

    const totalCursos = await prisma.eduCurso.count({
        where: {
            ativo: 1,
            deleted_at: null,
        },
    });

    const atleticas = await prisma.atlAtletica.findMany({
        where: {
            ativo: 1,
            deleted_at: null,
        },
        include: {
            edu_instituicao: true,
            atl_atletica_tema: true,
            atl_atletica_assinatura: {
                include: {
                    sys_assinatura_plano: true,
                    atl_atletica_assinatura_status: true,
                },
            },
        },
        orderBy: {
            nome: "asc",
        },
    });

    return (
        <main style={{ padding: 32, fontFamily: "Arial, sans-serif" }}>
            <h1>Brava Pass</h1>

            <p>
                Base inicial do sistema carregada com Next, Prisma e MariaDB.
            </p>

            <section
                style={{
                    display: "flex",
                    gap: 16,
                    marginTop: 24,
                    marginBottom: 32,
                }}
            >
                <div style={cardStyle}>
                    <strong>Usuários</strong>
                    <p style={numberStyle}>{totalUsuarios}</p>
                </div>

                <div style={cardStyle}>
                    <strong>Atléticas</strong>
                    <p style={numberStyle}>{totalAtleticas}</p>
                </div>

                <div style={cardStyle}>
                    <strong>Cursos</strong>
                    <p style={numberStyle}>{totalCursos}</p>
                </div>
            </section>

            <section>
                <h2>Atléticas cadastradas</h2>

                {atleticas.length === 0 && (
                    <p>Nenhuma atlética cadastrada ainda.</p>
                )}

                <div style={{ display: "grid", gap: 16 }}>
                    {atleticas.map((atletica) => {
                        const assinaturaAtual = atletica.atl_atletica_assinatura[0];

                        return (
                            <article key={atletica.id} style={cardStyle}>
                                <h3>{atletica.nome}</h3>

                                <p>
                                    <strong>Sigla:</strong> {atletica.sigla}
                                </p>

                                <p>
                                    <strong>Slug:</strong> {atletica.slug}
                                </p>

                                <p>
                                    <strong>Instituição:</strong>{" "}
                                    {atletica.edu_instituicao.nome}
                                </p>

                                <p>
                                    <strong>Tema:</strong>{" "}
                                    {atletica.atl_atletica_tema
                                        ? `${atletica.atl_atletica_tema.cor_primaria} / ${atletica.atl_atletica_tema.cor_secundaria}`
                                        : "Sem tema"}
                                </p>

                                <p>
                                    <strong>Assinatura:</strong>{" "}
                                    {assinaturaAtual
                                        ? `${assinaturaAtual.sys_assinatura_plano.nome} - ${assinaturaAtual.atl_atletica_assinatura_status.nome}`
                                        : "Sem assinatura"}
                                </p>
                            </article>
                        );
                    })}
                </div>
            </section>
        </main>
    );
}

const cardStyle: React.CSSProperties = {
    border: "1px solid #ddd",
    borderRadius: 12,
    padding: 16,
    background: "#fff",
    minWidth: 160,
};

const numberStyle: React.CSSProperties = {
    fontSize: 28,
    fontWeight: "bold",
    margin: "8px 0 0",
};