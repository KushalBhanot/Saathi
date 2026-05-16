import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface Props {
  queueLength: number;
}

export function OfflineBanner({ queueLength }: Props) {
  return (
    <View style={styles.banner}>
      <Text style={styles.icon}>📡</Text>
      <Text style={styles.text}>
        {queueLength > 0
          ? `Offline — ${queueLength} question${queueLength > 1 ? 's' : ''} queued`
          : 'Offline — questions will be sent when you reconnect'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: '#FEF3C7',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 9,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#FDE68A',
  },
  icon: { fontSize: 14 },
  text: { color: '#92400E', fontSize: 13, fontWeight: '600', flex: 1 },
});
