import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "七牛云第四届Hackathon - GitHub 仓库排行榜",
  description: "七牛云第四届Hackathon项目实时排行榜",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
