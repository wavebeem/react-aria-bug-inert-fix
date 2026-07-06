import "./globals.css";

export const metadata = {
  title: "RAC inert repro",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
