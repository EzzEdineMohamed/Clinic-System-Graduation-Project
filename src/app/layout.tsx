import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "عيادتي | نظام إدارة العيادة",
  description: "حجز الكشوفات وإدارة العيادة",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ar" dir="rtl" className="h-full">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
