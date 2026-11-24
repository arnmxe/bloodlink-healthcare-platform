import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "BloodLink | Connecting Donors. Saving Lives.",
  description:
    "Blood Donation, Inventory, and Transfusion Coordination Management System connecting voluntary blood donors, blood service facilities, and hospitals.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-[#F5F6F8] text-[#172B4D] antialiased selection:bg-[#C62828]/15 selection:text-[#8E1B1B]`}>
        {children}
      </body>
    </html>
  );
}
