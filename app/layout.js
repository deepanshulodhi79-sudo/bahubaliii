import "./globals.css";

export const metadata = {
  title: "Gmail Sender",
  description: "Simple Gmail SMTP Sender",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
