import nodemailer from "nodemailer";

const MAX_RECIPIENTS = 100; // ek baar me limit
const DELAY_MS = 2500;      // har mail ke beech gap (spam se bachne ke liye)
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

// header injection se bachne ke liye newline aur quotes hatao
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

    const fromEmail = senderEmail.trim();
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
        { success: false, error: `Max ${MAX_RECIPIENTS} recipients at a time.` },
        { status: 400 }
      );
    }

    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: fromEmail,
        pass: appPassword.trim().replace(/\s/g, ""),
      },
    });

    const name = cleanHeader(senderName);
    const cleanSubject = cleanHeader(subject);
    const cleanMessage = message.trim();

    const footerText = `\n\n--\n${name}\nAgar aap ye mails nahi chahte, is mail par "unsubscribe" likh kar reply karein.`;

    const htmlMessage = escapeHtml(cleanMessage).replace(/\r?\n/g, "<br>");

    let sent = 0;
    const failedList = [];

    for (const recipient of recipientList) {
      try {
        await transporter.sendMail({
          from: `"${name}" <${fromEmail}>`,
          to: recipient,
          replyTo: fromEmail,
          subject: cleanSubject,
          text: cleanMessage + footerText,
          html: `
            <div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.6;color:#222;">
              ${htmlMessage}
              <p style="font-size:12px;color:#888;margin-top:24px;">
                -- <br>${escapeHtml(name)}<br>
                Agar aap ye mails nahi chahte, is mail par "unsubscribe" likh kar reply karein.
              </p>
            </div>
          `,
          headers: {
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
