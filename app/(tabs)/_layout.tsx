import { Redirect, Tabs } from 'expo-router';
import { Text } from 'react-native';
import { colors } from '../../src/constants/theme';
import LoadingScreen from '../../src/components/LoadingScreen';
import { useApp } from '../../src/context/AppContext';

const icons: Record<string, string> = {
  index: '⌂',
  history: '◷',
  profile: '◉',
};

export default function TabLayout() {
  const { authLoading, authUser } = useApp();
  if (authLoading) return <LoadingScreen />;
  if (!authUser) return <Redirect href="/(auth)" />;

  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: {
          height: 66,
          paddingTop: 7,
          paddingBottom: 8,
          borderTopColor: colors.line,
          backgroundColor: colors.surface,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '700' },
        tabBarIcon: ({ color }) => (
          <Text style={{ color, fontSize: 22, fontWeight: '700' }}>{icons[route.name] ?? '•'}</Text>
        ),
      })}
    >
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="history" options={{ title: 'History' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
    </Tabs>
  );
}
