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
    backgroundColor: '#F59E0B',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  icon: {
    fontSize: 14,
  },
  text: {
    color: '#1C1917',
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
  },
});
