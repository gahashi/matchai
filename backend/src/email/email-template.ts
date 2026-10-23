// Template original do MatchAI, compatível com clientes de email que usam CSS inline.
export function escapeHtml(value: string): string {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#39;");
}

export function emailTemplate(title: string, body: string): string {
  const heading = escapeHtml(title);
  const message = escapeHtml(body).replaceAll("\n", "<br>");
  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="margin:0;background:#0e0e0e;color:#f6f5f1;font-family:Arial,sans-serif;padding:24px"><table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr><td align="center"><table role="presentation" style="width:100%;max-width:550px;background:#191919;border:1px solid #343434;border-radius:18px" cellspacing="0"><tr><td style="padding:30px"><div style="font-size:24px;font-weight:900;color:#ffd21b">MatchAI</div><h1 style="font-size:25px;margin-top:26px;color:#fff">${heading}</h1><p style="line-height:1.7;color:#d3d3d3">${message}</p><p style="font-size:12px;color:#999;margin-top:35px">Esta é uma mensagem automática do MatchAI.</p></td></tr></table></td></tr></table></body></html>`;
}
