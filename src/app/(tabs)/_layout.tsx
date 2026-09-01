import { Tabs } from 'expo-router';
import { View, StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  CalendarCheck,
  HandCoins,
  Users,
  Wallet,
} from 'lucide-react-native';
import { colors } from '@/lib/colors';
import { fonts, radii, shadows } from '@/lib/theme';

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const bottomPadding = Platform.OS === 'web' ? 26 : Math.max(insets.bottom, 14);
  const tabHeight = Platform.OS === 'web' ? 84 : 64 + insets.bottom;

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
          height: tabHeight,
          paddingTop: 8,
          paddingBottom: bottomPadding,
          ...shadows.sm,
        },
        tabBarItemStyle: {
          justifyContent: 'center',
          alignItems: 'center',
        },
        tabBarLabelStyle: {
          fontFamily: fonts.bold,
          fontSize: 11,
          fontWeight: '700',
          marginTop: 2,
          marginBottom: Platform.OS === 'web' ? 6 : 0,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Cobros Hoy',
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconPill, focused && styles.iconPillActive]}>
              <CalendarCheck size={20} color={focused ? colors.primaryDark : color} />
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
              <HandCoins size={20} color={focused ? colors.primaryDark : color} />
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
              <Users size={20} color={focused ? colors.primaryDark : color} />
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
              <Wallet size={20} color={focused ? colors.primaryDark : color} />
            </View>
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconPill: {
    paddingVertical: 2,
    paddingHorizontal: 12,
    borderRadius: radii.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconPillActive: {
    backgroundColor: colors.primarySoft,
  },
});
