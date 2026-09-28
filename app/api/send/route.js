import nodemailer from "nodemailer";

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

    const recipientList = recipients
      .split(/\r?\n|,/)
      .map((email) => email.trim())
      .filter(Boolean);

    if (
      !senderName ||
      !senderEmail ||
      !appPassword ||
      !recipientList.length ||
      !subject ||
      !message
    ) {
      return Response.json(
        {
          success: false,
          error: "Please fill all fields.",
        },
        { status: 400 }
      );
    }

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: senderEmail,
        pass: appPassword,
      },
    });

    const htmlMessage = message
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\r?\n/g, "<br>");

    let sent = 0;
    let failed = 0;

    for (const recipient of recipientList) {
      try {
        await transporter.sendMail({
          from: `"${senderName}" <${senderEmail}>`,
          to: recipient,
          subject: subject,
          text: message,
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
    return Response.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
}
