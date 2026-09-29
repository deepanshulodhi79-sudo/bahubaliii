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

    if (
      !senderName ||
      !senderEmail ||
      !appPassword ||
      !recipients ||
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
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: senderEmail.trim(),
        pass: appPassword.trim(),
      },
    });

    const recipientList = recipients
      .split(/[\n,]+/)
      .map((email) => email.trim())
      .filter(Boolean);

    let sent = 0;
    let failed = 0;

    for (const recipient of recipientList) {
      try {
        await transporter.sendMail({
          from: `"${senderName.trim()}" <${senderEmail.trim()}>`,
          to: recipient,
          subject: subject.trim(),
          text: message.trim(),
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
