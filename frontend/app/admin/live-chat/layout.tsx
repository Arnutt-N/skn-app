import React from 'react';

export default function LiveChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // This layout intentionally returns ONLY the children
  // This prevents the admin layout from wrapping the live-chat page
  // The live-chat page will have its own full-page sidebar
  return <>{children}</>;
}
