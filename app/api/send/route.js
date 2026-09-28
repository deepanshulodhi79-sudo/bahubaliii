import nodemailer from "nodemailer";

export async function POST(req) {
  try {
    const { senderName, senderEmail, appPassword, recipients, subject, message } =
      await req.json();

    if (!senderName || !senderEmail || !appPassword || !recipients || !subject || !message) {
      return Response.json(
        { success: false, error: "Please fill all required fields." },
        { status: 400 }
      );
    }

    const fromEmail = senderEmail.trim().toLowerCase();

    // Clean recipient emails and remove duplicates
    const recipientList = [
      ...new Set(
        recipients
          .split(/[\n,]+/)
          .map((email) => email.trim().toLowerCase())
          .filter((email) => email.includes("@"))
      ),
    ];

    if (recipientList.length === 0) {
      return Response.json(
        { success: false, error: "No valid recipients found." },
        { status: 400 }
      );
    }

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: fromEmail,
        pass: appPassword.trim().replace(/\s/g, ""), // Remove spaces from App Password
      },
    });

    let sent = 0;
    const failedList = [];

    for (const recipient of recipientList) {
      try {
        await transporter.sendMail({
          from: `"${senderName}" <${fromEmail}>`,
          to: recipient,
          subject: subject.trim(),
          text: message.trim(), // Plain text fallback (helps avoid spam filters)
          html: `<div style="font-family: sans-serif; font-size: 15px; color: #222; line-height: 1.5;">${message.replace(/\n/g, "<br>")}</div>`,
        });

        sent++;
      } catch (error) {
        failedList.push(recipient);
        console.error(`Error sending to ${recipient}:`, error.message);
      }

      // 3-second delay between each email send
      await new Promise((r) => setTimeout(r, 3000));
    }

    return Response.json({
      success: true,
      sent,
      failed: failedList.length,
      failedList,
    });
  } catch (error) {
    console.error("API Error:", error);
    return Response.json(
      { success: false, error: error.message || "Failed to send emails." },
      { status: 500 }
    );
  }
}
