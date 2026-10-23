import { verifySmtp, sendEmail } from "../src/email/send-email.js";

await verifySmtp();
console.log("[OK] Conexão/autenticação SMTP validada");

const index = process.argv.indexOf("--to");
if (index !== -1) {
  const to = process.argv[index + 1];
  if (!to || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) throw new Error("Use --to usuario@dominio.com");
  const r = await sendEmail({
    to,
    subject: "Teste de integração MatchAI",
    text: "Envio SMTP do MatchAI funcionando. Esta mensagem é um teste solicitado manualmente.",
  });
  console.log("[OK] Email aceito pelo servidor SMTP. ID:", r.messageId);
} else {
  console.log("Nenhum email enviado. Para enviar: npm run check:email -- --to seu@email.com");
}
