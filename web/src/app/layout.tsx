import type { Metadata } from "next";
import { Nanum_Myeongjo } from "next/font/google";
import "./globals.css";

const myeongjo = Nanum_Myeongjo({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-myeongjo",
  display: "swap",
});

export const metadata: Metadata = {
  title: "합 — 우리 사주 궁합",
  description: "생년월일만으로 보는 사주 궁합. 우리, 합이 맞을까?",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className={`${myeongjo.variable} antialiased`}>{children}</body>
    </html>
  );
}
