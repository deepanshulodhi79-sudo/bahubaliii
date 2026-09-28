import nodemailer from "nodemailer";

const MAX_RECIPIENTS = 50; // Reduced batch size to prevent Gmail aggressive rate-limiting
const DELAY_MS = 3500; // Increased delay to simulate human/normal sending speed
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

const cleanHeader = (s) => String(s).replace(/[\r\n"<>]/g, "").trim();

export async function POST(req) {
  try {
    const { senderName, senderEmail, appPassword, recipients, subject, message } =
      await req.json();

    if (
      !senderName?.trim() ||
      !senderEmail?.trim() ||
      !appPassword?.trim() ||
      !recipients?.trim() ||
      !subject?.trim() ||
      !message?.trim()
    ) {
      return Response.json(
        { success: false, error: "Please fill all fields." },
        { status: 400 }
      );
    }

    const fromEmail = senderEmail.trim().toLowerCase();
    if (!EMAIL_RE.test(fromEmail)) {
      return Response.json(
        { success: false, error: "Invalid sender email." },
        { status: 400 }
      );
    }

    const recipientList = [
      ...new Set(
        recipients
          .split(/[\n,]+/)
          .map((email) => email.trim().toLowerCase())
          .filter((email) => EMAIL_RE.test(email))
      ),
    ];

    if (recipientList.length === 0) {
      return Response.json(
        { success: false, error: "No valid recipient emails." },
        { status: 400 }
      );
    }

    if (recipientList.length > MAX_RECIPIENTS) {
      return Response.json(
        { success: false, error: `Max ${MAX_RECIPIENTS} recipients at a time for inbox health.` },
        { status: 400 }
      );
    }

    // SMTP Transporter Optimization with Connection Pooling
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: fromEmail,
        pass: appPassword.trim().replace(/\s/g, ""),
      },
      pool: true,
      maxConnections: 1,
      maxMessages: 50,
    });

    const name = cleanHeader(senderName);
    const cleanSubject = cleanHeader(subject);
    const cleanMessage = message.trim();
    const htmlContent = escapeHtml(cleanMessage).replace(/\r?\n/g, "<br>");

    // Responsive & Deliverability-optimized HTML Template
    const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${cleanSubject}</title>
</head>
<body style="margin:0; padding:20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color:#f9f9f9; color:#333333; line-height:1.6;">
  <div style="max-width:600px; margin:0 auto; background:#ffffff; padding:24px; border-radius:6px; border:1px solid #e5e5e5;">
    <div style="font-size:15px; color:#222222;">
      ${htmlContent}
    </div>
    <div style="margin-top:30px; padding-top:15px; border-top:1px solid #eee; font-size:12px; color:#888888; text-align:center;">
      Sent by ${name} (${fromEmail})
    </div>
  </div>
</body>
</html>`;

    let sent = 0;
    const failedList = [];

    for (const recipient of recipientList) {
      try {
        await transporter.sendMail({
          from: `"${name}" <${fromEmail}>`,
          to: recipient,
          subject: cleanSubject,
          text: cleanMessage, // Strict plain text fallback
          html: fullHtml,
          // Headers for improving inbox delivery rate
          headers: {
            "X-Mailer": "Nodemailer Mailer",
            "X-Priority": "3",
            "List-Unsubscribe": `<mailto:${fromEmail}?subject=unsubscribe>`,
          },
        });

        sent++;
      } catch (error) {
        failedList.push(recipient);
        console.error(`Failed: ${recipient}`, error.message);
      }

      await sleep(DELAY_MS);
    }

    transporter.close();

    return Response.json({
      success: true,
      sent,
      failed: failedList.length,
      failedList,
    });
  } catch (error) {
    console.error("SEND ERROR:", error);

    return Response.json(
      { success: false, error: "Failed to send email." },
      { status: 500 }
    );
  }
}
