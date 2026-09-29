import nodemailer from "nodemailer";

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

const allowedMailboxes = [
  "hello@clientboost.in",
  "contact@clientboost.in",
  "info@clientboost.in",
  "sales@clientboost.in",
  "support@clientboost.in",
];

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

    const email = senderEmail.trim().toLowerCase();

    if (!allowedMailboxes.includes(email)) {
      return Response.json(
        {
          success: false,
          error: "Invalid sender mailbox.",
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

    // Current trial limit: 20 emails/hour/mailbox.
    if (recipientList.length > 20) {
      return Response.json(
        {
          success: false,
          error:
            "Your current Private Email trial allows 20 outgoing emails per hour per mailbox. Please send to 20 recipients or fewer.",
        },
        { status: 400 }
      );
    }

    const transporter = nodemailer.createTransport({
      host: "mail.privateemail.com",
      port: 465,
      secure: true,
      auth: {
        user: email,
        pass: appPassword.trim(),
      },
    });

    const cleanMessage = message.trim();

    const htmlMessage = escapeHtml(cleanMessage).replace(
      /\r?\n/g,
      "<br>"
    );

    let sent = 0;
    let failed = 0;

    for (const recipient of recipientList) {
      try {
        await transporter.sendMail({
          from: `"${senderName.trim()}" <${email}>`,
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
