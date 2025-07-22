import "@/src/globals.css";
// Use this to merge tailwind classes
import { cn } from "@/src/lib/utils";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <title>Quint</title>
      </head>
      <body>
        <div className="container mx-auto">{children}</div>
      </body>
    </html>
  );
}
