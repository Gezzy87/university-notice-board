import nodemailer from "nodemailer";

// Gmail SMTP transport. Requires an App Password (2FA must be enabled on the
// Gmail account) — a normal account password will be rejected by Google.
// See README for setup. Daily send limit is ~500 emails, which is plenty here.
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

export type SendEmailOptions = {
  to: string;
  subject: string;
  html: string;
  text?: string;
};

export async function sendEmail({ to, subject, html, text }: SendEmailOptions) {
  const from = process.env.EMAIL_FROM ?? process.env.GMAIL_USER;
  return transporter.sendMail({ from, to, subject, html, text });
}
