// import "dotenv/config";
import dotenv from "dotenv";
dotenv.config({ override: false });

import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendEmail(to: string, subject: string, body: string) {
  const info = await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to,
    subject,
    text: body,
    html: `
  <div style="font-family:sans-serif;max-width:500px;padding:24px">
    <h2 style="color:#1D9E75">${subject}</h2>
    <p style="color:#333;line-height:1.6">${body}</p>
    <hr style="border:none;border-top:1px solid #eee;margin:20px 0"/>
    <small style="color:#888">
      Sent asynchronously via Distributed Job Queue System
    </small>
  </div>
`,
  });

  console.log(`[email] message sent - id: ${info.messageId}`);
  return info;
}
