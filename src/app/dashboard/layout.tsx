import type { Metadata } from "next";
import { DM_Mono, Syne } from "next/font/google";

const syne = Syne({
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
  variable: "--font-syne",
});

const dmMono = DM_Mono({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  variable: "--font-dm-mono",
});

export const metadata: Metadata = {
  title: "AI Usage · Dashboard",
  description: "Local AI token & cost tracker.",
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <div className={`${syne.variable} ${dmMono.variable}`}>{children}</div>;
}
