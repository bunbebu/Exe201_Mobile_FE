import React from 'react';

import { Inbox } from '@novu/react';
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
  if (Platform.OS !== 'web') return null;

  return (
    <View style={{ width: '100%' }}>
      <Inbox
        applicationIdentifier={applicationIdentifier}
        subscriber={subscriberId}
        subscriberHash={subscriberHash ?? undefined}
        backendUrl={backendUrl}
        socketUrl={socketUrl}
        routerPush={(path: string) => router.push(path as any)}
      />
    </View>
  );
}

