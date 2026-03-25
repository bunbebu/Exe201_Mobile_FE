import React from 'react';
import { router } from 'expo-router';
import { Platform, View } from 'react-native';

type Props = {
  applicationIdentifier: string;
  subscriberId: string;
  socketUrl?: string;
  subscriberHash?: string | null;
  backendUrl?: string;
};

export function NovuInbox({
  applicationIdentifier,
  subscriberId,
  socketUrl,
  subscriberHash,
  backendUrl,
}: Props) {
  // On mobile/native we intentionally do not import `@novu/react`.
  // The Novu Inbox UI depends on web/Solid packages that are not compatible
  // with the React Native bundler.
  // The real implementation lives in `novu-inbox.web.tsx`.
  if (Platform.OS !== 'web') return null;

  // If someone renders this file on web (shouldn't happen due to platform extensions),
  // fail gracefully.
  return null;
}

