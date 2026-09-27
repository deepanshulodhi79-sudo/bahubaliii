"use client";

import { useState } from "react";

export default function Home() {
  const [senderEmail, setSenderEmail] = useState("");
  const [appPassword, setAppPassword] = useState("");
  const [recipient, setRecipient] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState("");

  async function sendMail() {
    setStatus("Sending...");

    try {
      const response = await fetch("/api/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          senderEmail,
          appPassword,
          recipient,
          subject,
          message,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setStatus("Email sent successfully!");
      } else {
        setStatus(data.error || "Failed to send email.");
      }
    } catch (error) {
      setStatus(error.message);
    }
  }

  return (
    <main className="container">
      <h1>Gmail Sender</h1>

      <input
        type="email"
        placeholder="Gmail ID"
        value={senderEmail}
        onChange={(e) => setSenderEmail(e.target.value)}
      />

      <input
        type="password"
        placeholder="App Password"
        value={appPassword}
        onChange={(e) => setAppPassword(e.target.value)}
      />

      <input
        type="email"
        placeholder="Recipient Gmail"
        value={recipient}
        onChange={(e) => setRecipient(e.target.value)}
      />

      <input
        type="text"
        placeholder="Subject"
        value={subject}
        onChange={(e) => setSubject(e.target.value)}
      />

      <textarea
        placeholder="Message"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
      />

      <button onClick={sendMail}>
        Send Email
      </button>

      <p>{status}</p>
    </main>
  );
}
