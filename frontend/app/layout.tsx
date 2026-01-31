import type { Metadata } from 'next'
import { Noto_Sans_Thai } from 'next/font/google'
import './globals.css'

const notoThai = Noto_Sans_Thai({
    subsets: ['thai', 'latin'],
    weight: ['300', '400', '500', '600', '700'],
    variable: '--font-noto-thai',
})

export const metadata: Metadata = {
    title: 'JskApp - Community Justice Services',
    description: 'LINE Official Account for Community Justice Center',
}

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="th" suppressHydrationWarning className={`${notoThai.variable}`}>
            <body suppressHydrationWarning className="font-sans antialiased text-foreground bg-background">{children}</body>
        </html>
    )
}
