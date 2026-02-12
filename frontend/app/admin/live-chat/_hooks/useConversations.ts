'use client';

import type { Conversation } from '../_types';

export function useConversations(conversations: Conversation[], query: string) {
  const q = query.trim().toLowerCase();
  const isTagFilter = q.startsWith('#') || q.startsWith('tag:');
  const tagQuery = isTagFilter ? q.replace(/^tag:/, '').replace(/^#/, '').trim() : '';
  const filtered = conversations.filter((conv) => {
    if (!q) return true;
    if (isTagFilter) {
      return (conv.tags || []).some((tag) => tag.name.toLowerCase().includes(tagQuery));
    }
    return (
      (conv.display_name || '').toLowerCase().includes(q) ||
      conv.line_user_id.toLowerCase().includes(q)
    );
  });

  const waitingCount = conversations.filter((c) => c.session?.status === 'WAITING').length;
  const activeCount = conversations.filter((c) => c.session?.status === 'ACTIVE').length;

  return { filtered, waitingCount, activeCount };
}
