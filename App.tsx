import { StatusBar } from 'expo-status-bar';
import { SafeAreaView, StyleSheet, View, Text, ActivityIndicator } from 'react-native';
import GameScreen from './src/screens/GameScreen';
import { EulaModal } from './src/components/EulaModal';
import { useEulaAcceptance } from './src/hooks/useEulaAcceptance';

export default function App() {
  const { hasAccepted, isLoading, acceptEula } = useEulaAcceptance();

  // Show loading while checking EULA status
  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="light" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF6B35" />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />

      {/* EULA Modal - shown on first launch */}
      <EulaModal
        visible={!hasAccepted}
        onAccept={acceptEula}
      />

      {/* Game content - only interactive after EULA accepted */}
      <GameScreen seed={Date.now()} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1A1A2E',
  },
  loadingText: {
    color: '#FFF',
    fontSize: 16,
    marginTop: 16,
  },
});
