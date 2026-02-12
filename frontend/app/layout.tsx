import type { Metadata } from 'next'
import { Inter, Noto_Sans_Thai } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/providers'

const notoThai = Noto_Sans_Thai({
    subsets: ['thai', 'latin'],
    weight: ['300', '400', '500', '600', '700'],
    variable: '--font-noto-thai',
})

const inter = Inter({
    subsets: ['latin'],
    variable: '--font-inter',
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
        <html lang="th" suppressHydrationWarning className={`${notoThai.variable} ${inter.variable}`}>
            <body suppressHydrationWarning className="font-sans antialiased">
                <Providers>
                    {children}
                </Providers>
            </body>
        </html>
    )
}
