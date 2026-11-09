import { Redirect } from 'expo-router';
import LoadingScreen from '../src/components/LoadingScreen';
import { useApp } from '../src/context/AppContext';

export default function IndexRoute() {
  const { authLoading, authUser } = useApp();
  if (authLoading) return <LoadingScreen />;
  return <Redirect href={authUser ? '/(tabs)' : '/(auth)'} />;
}
