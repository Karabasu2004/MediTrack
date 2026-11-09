import { Redirect, Stack } from 'expo-router';
import LoadingScreen from '../../src/components/LoadingScreen';
import { useApp } from '../../src/context/AppContext';

export default function AuthLayout() {
  const { authLoading, authUser } = useApp();
  if (authLoading) return <LoadingScreen />;
  if (authUser) return <Redirect href="/(tabs)" />;
  return <Stack screenOptions={{ headerShown: false }} />;
}
