import { Tabs } from 'expo-router';
import { View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  CalendarCheck,
  HandCoins,
  Users,
  Wallet,
  Sparkles,
} from 'lucide-react-native';
import { colors } from '@/lib/colors';
import { fonts, radii, shadows, spacing } from '@/lib/theme';

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const bottomPadding = Math.max(insets.bottom, 12);

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
          height: 64 + bottomPadding,
          paddingTop: 10,
          paddingBottom: bottomPadding,
          ...shadows.sm,
        },
        tabBarLabelStyle: {
          fontFamily: fonts.bold,
          fontSize: 12,
          marginTop: 4,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Cobros Hoy',
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconPill, focused && styles.iconPillActive]}>
              <CalendarCheck size={22} color={focused ? colors.primaryDark : color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="prestamos"
        options={{
          title: 'Préstamos',
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconPill, focused && styles.iconPillActive]}>
              <HandCoins size={22} color={focused ? colors.primaryDark : color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="clientes"
        options={{
          title: 'Clientes',
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconPill, focused && styles.iconPillActive]}>
              <Users size={22} color={focused ? colors.primaryDark : color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="capital"
        options={{
          title: 'Caja & Capital',
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconPill, focused && styles.iconPillActive]}>
              <Wallet size={22} color={focused ? colors.primaryDark : color} />
            </View>
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconPill: {
    paddingVertical: 4,
    paddingHorizontal: 16,
    borderRadius: radii.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconPillActive: {
    backgroundColor: colors.primarySoft,
  },
});
