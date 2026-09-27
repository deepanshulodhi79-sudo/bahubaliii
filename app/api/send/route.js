import nodemailer from "nodemailer";

export async function POST(req) {
  try {
    const {
      senderEmail,
      appPassword,
      recipient,
      subject,
      message,
    } = await req.json();

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: senderEmail,
        pass: appPassword,
      },
    });

    await transporter.sendMail({
      from: senderEmail,
      to: recipient,
      subject: subject,
      text: message,
    });

    return Response.json({
      success: true,
    });
  } catch (error) {
    return Response.json(
      {
        success: false,
        error: error.message,
      },
      {
        status: 500,
      }
    );
  }
}
