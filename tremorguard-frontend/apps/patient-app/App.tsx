import React from 'react';
import { SafeAreaView, Text, StyleSheet, View } from 'react-native';
import type { BleService } from '@tremorguard/ble-service';
import type { Database } from '@tremorguard/local-db';
import type { SyncEngine } from '@tremorguard/sync-engine';
import { createLogger } from '@tremorguard/utils';

const logger = createLogger('patient-app');

interface AppServices {
  bleService: BleService;
  database: Database;
  syncEngine: SyncEngine;
}

const App: React.FC = () => {
  logger.info('App initialized');

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>TremorGuard</Text>
        <Text style={styles.subtitle}>Patient App v0.1.0</Text>
        <Text style={styles.description}>
          帕金森病震颤监测智能腕带 - 患者端
        </Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0f',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#9ca3af',
    marginBottom: 24,
  },
  description: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
});

export default App;
