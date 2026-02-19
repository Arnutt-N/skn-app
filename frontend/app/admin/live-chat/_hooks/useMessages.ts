'use client';

import { useMemo } from 'react';

import type { Message } from '@/lib/websocket/types';

export function useMessages(messages: Message[]) {
  const oldestId = useMemo(() => {
    if (!messages.length) return undefined;
    return messages[0].id > 0 ? messages[0].id : undefined;
  }, [messages]);

  return { oldestId };
}
