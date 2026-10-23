import nodemailer from "nodemailer";
import { getEmailConfig } from "../config.js";
import { emailTemplate } from "./email-template.js";

// Extraído conceitualmente do transporte do Brava Pass.
// Independente de SysUsuario, Prisma e Next.js; persistência de logs será conectada depois.
export async function verifySmtp(): Promise<void> {
  const config = getEmailConfig();
  const client = nodemailer.createTransport(config.smtp);
  try { await client.verify(); } finally { client.close(); }
}

export async function sendEmail(input: { to: string; subject: string; text: string }) {
  const config = getEmailConfig();
  const client = nodemailer.createTransport(config.smtp);
  try {
    const result = await client.sendMail({
      from: config.from,
      to: input.to,
      subject: input.subject,
      text: input.text,
      html: emailTemplate(input.subject, input.text),
    });
    return { ok: true, messageId: result.messageId };
  } finally {
    client.close();
  }
}
