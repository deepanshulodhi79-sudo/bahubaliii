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

    const recipientList = [
      ...new Set(
        recipients
          .split(/[\n,]+/)
          .map((email) => email.trim())
          .filter(Boolean)
      ),
    ];

    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      pool: true,
      maxConnections: 5,
      maxMessages: 20,
      auth: {
        user: senderEmail.trim(),
        pass: appPassword.trim(),
      },
    });

    const results = await Promise.allSettled(
      recipientList.map((recipient) =>
        transporter.sendMail({
          from: `"${senderName.trim()}" <${senderEmail.trim()}>`,
          to: recipient,
          subject: subject.trim(),
          text: message.trim(),
        })
      )
    );

    const sent = results.filter(
      (result) => result.status === "fulfilled"
    ).length;

    const failed = results.length - sent;

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
