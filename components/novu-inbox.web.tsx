import React from 'react';

import { Text, View } from 'react-native';

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
  // Placeholder: no utilizamos `@novu/react` aqui para evitar quebrar o bundling do Expo no ambiente atual.
  // Se você quiser habilitar de novo o Inbox web, a gente reintroduz a implementação real depois.
  return (
    <View style={{ width: '100%', padding: 16 }}>
      <Text style={{ color: '#8B5CF6', fontWeight: '600' }}>
        Novu Inbox indisponível no build atual
      </Text>
      <Text style={{ marginTop: 8, color: '#6B7280' }}>
        (Dependências web do Novu/Solid não estão compatíveis com este ambiente.)
      </Text>
    </View>
  );
}

