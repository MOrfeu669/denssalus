import { Montserrat, PT_Mono, Roboto } from "next/font/google";
import { cn } from "@/lib/utils";

const roboto = Roboto({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  display: "swap",
  variable: "--font-sans",
});

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["600", "700"],
  display: "swap",
  variable: "--font-heading",
});

const ptMono = PT_Mono({
  subsets: ["latin"],
  weight: ["400"],
  display: "swap",
  variable: "--font-mono",
});

export const tipografiaCasca = cn(
  roboto.variable,
  montserrat.variable,
  ptMono.variable,
  roboto.className,
);
