import bcrypt from "bcryptjs";

/**
 * Email service using ZeptoMail SMTP.
 *
 * ZeptoMail SMTP credentials:
 * - Host: smtp.zoho.com (or smtp.zeptomail.com depending on region)
 * - Port: 465 (SSL) or 587 (TLS)
 * - User: your ZeptoMail SMTP user
 * - Pass: your ZeptoMail SMTP password
 */

interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
}

let _transporter: any = null;

async function getTransporter() {
  if (_transporter) return _transporter;
  const nodemailer = await import("nodemailer");
  _transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST ?? "smtp.zoho.com",
    port: Number(process.env.SMTP_PORT ?? 465),
    secure: true,
    auth: {
      user: process.env.SMTP_USER ?? "",
      pass: process.env.SMTP_PASS ?? "",
    },
  });
  return _transporter;
}

export async function sendEmail(opts: EmailOptions): Promise<boolean> {
  const from = opts.from ?? process.env.SMTP_FROM ?? process.env.SMTP_USER ?? "";
  if (!from) {
    console.error("[email] No from address configured");
    return false;
  }
  try {
    const transporter = await getTransporter();
    await transporter.sendMail({
      from,
      to: Array.isArray(opts.to) ? opts.to.join(", ") : opts.to,
      subject: opts.subject,
      html: opts.html,
      text: opts.text,
    });
    console.log(`[email] Sent to ${opts.to}`);
    return true;
  } catch (e) {
    console.error("[email] Failed:", e);
    return false;
  }
}

export async function sendTicketNotification(ticket: {
  ticketNumber: string;
  subject: string;
  description: string;
  priority: string;
  visitorName?: string | null;
  visitorEmail?: string | null;
  assignedTo?: string | null;
}) {
  if (!ticket.assignedTo) {
    console.log("[email] No assigned executive, skipping notification");
    return false;
  }
  const html = `
    <div style="font-family:system-ui,sans-serif;max-width:600px;margin:auto;padding:24px">
      <h2 style="color:#1c6ff5">New Support Ticket — ${ticket.ticketNumber}</h2>
      <p><strong>Priority:</strong> ${ticket.priority}</p>
      <p><strong>From:</strong> ${ticket.visitorName || "Anonymous"} ${ticket.visitorEmail ? `(${ticket.visitorEmail})` : ""}</p>
      <p><strong>Subject:</strong> ${ticket.subject}</p>
      <p><strong>Description:</strong></p>
      <div style="background:#f8fafc;padding:16px;border-radius:8px;white-space:pre-wrap">${ticket.description}</div>
      <p style="margin-top:24px"><a href="${process.env.NEXT_PUBLIC_APP_URL ?? "https://ramat.echosystems.ng"}/admin/tickets" style="background:#1c6ff5;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none">View in Admin</a></p>
    </div>
  `;
  return sendEmail({
    to: ticket.assignedTo,
    subject: `[${ticket.priority.toUpperCase()}] New Ticket ${ticket.ticketNumber} — ${ticket.subject}`,
    html,
    text: `New support ticket ${ticket.ticketNumber}\nPriority: ${ticket.priority}\nFrom: ${ticket.visitorName || "Anonymous"}\nSubject: ${ticket.subject}\n\n${ticket.description}`,
  });
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
