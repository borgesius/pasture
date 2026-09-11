import type { Metadata } from "next"
import { Nunito } from "next/font/google"
import "./globals.css"

const nunito = Nunito({ subsets: ["latin"], weight: ["400", "600", "700", "800"], variable: "--font-nunito" })

export const metadata: Metadata = {
  title: "Pasture",
  description: "Every pull request on your team is a cow. Watch them move from pen to pen as they get reviewed, fixed and merged.",
  icons: { icon: "/img/cow-side.png" },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={nunito.variable}>
      <body>{children}</body>
    </html>
  )
}
