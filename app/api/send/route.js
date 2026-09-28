import nodemailer from "nodemailer";

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export async function POST(req) {
  try {
    const {
      senderName,
      senderEmail,
      appPassword,
      recipients,
      subject,
      message,
    } = await req.json();

    if (
      !senderName?.trim() ||
      !senderEmail?.trim() ||
      !appPassword?.trim() ||
      !recipients?.trim() ||
      !subject?.trim() ||
      !message?.trim()
    ) {
      return Response.json(
        {
          success: false,
          error: "Please fill all fields.",
        },
        { status: 400 }
      );
    }

    const recipientList = [
      ...new Set(
        recipients
          .split(/[\n,]+/)
          .map((email) => email.trim().toLowerCase())
          .filter(Boolean)
      ),
    ];

    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: senderEmail.trim(),
        pass: appPassword.trim(),
      },
    });

    const cleanMessage = message.trim();

    const htmlMessage = escapeHtml(cleanMessage)
      .replace(/\r?\n/g, "<br>");

    let sent = 0;
    let failed = 0;

    for (const recipient of recipientList) {
      try {
        await transporter.sendMail({
          from: `"${senderName.trim()}" <${senderEmail.trim()}>`,
          to: recipient,
          subject: subject.trim(),
          text: cleanMessage,
          html: `
            <div style="
              font-family: Arial, Helvetica, sans-serif;
              font-size: 15px;
              line-height: 1.6;
            ">
              ${htmlMessage}
            </div>
          `,
        });

        sent++;
      } catch (error) {
        failed++;
        console.error(`Failed: ${recipient}`, error.message);
      }
    }

    transporter.close();

    return Response.json({
      success: true,
      sent,
      failed,
    });
  } catch (error) {
    console.error("SEND ERROR:", error);

    return Response.json(
      {
        success: false,
        error: error.message || "Failed to send email.",
      },
      { status: 500 }
    );
  }
}
