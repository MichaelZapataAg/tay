import { Tabs } from 'expo-router';
import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  CalendarCheck,
  HandCoins,
  Users,
  Wallet,
} from 'lucide-react-native';
import { colors } from '@/lib/colors';
import { fonts } from '@/lib/theme';

export default function TabLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primaryDark,
        tabBarInactiveTintColor: colors.inkLight,
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: Platform.OS === 'web' ? 64 : 54 + insets.bottom,
          paddingTop: 6,
          paddingBottom: Platform.OS === 'web' ? 10 : insets.bottom || 8,
        },
        tabBarLabelStyle: {
          fontFamily: fonts.bold,
          fontSize: 11,
          fontWeight: '700',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Cobros Hoy',
          tabBarIcon: ({ color }) => <CalendarCheck size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="prestamos"
        options={{
          title: 'Préstamos',
          tabBarIcon: ({ color }) => <HandCoins size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="clientes"
        options={{
          title: 'Clientes',
          tabBarIcon: ({ color }) => <Users size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="capital"
        options={{
          title: 'Caja & Capital',
          tabBarIcon: ({ color }) => <Wallet size={22} color={color} />,
        }}
      />
    </Tabs>
  );
}
