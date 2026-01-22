"use client"

import Script from 'next/script'

export default function LiffLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <>
            <Script
                src="https://static.line-scdn.net/liff/edge/2/sdk.js"
                strategy="beforeInteractive"
            />
            {children}
        </>
    )
}
