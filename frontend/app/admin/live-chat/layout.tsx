// Live chat uses standalone layout - bypass admin sidebar
export default function LiveChatLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
