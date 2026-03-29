const normalizePublicLink = (value?: string | null) => {
  const normalized = value?.trim();
  return normalized ? normalized : undefined;
};

export const landingPublicLinks = {
  lineOfficialAccount:
    normalizePublicLink(process.env.NEXT_PUBLIC_LINE_ADD_FRIEND_URL) ??
    normalizePublicLink(process.env.NEXT_PUBLIC_LINE_OFFICIAL_ACCOUNT_URL),
  privacyPolicy: normalizePublicLink(process.env.NEXT_PUBLIC_PRIVACY_POLICY_URL),
} as const;
