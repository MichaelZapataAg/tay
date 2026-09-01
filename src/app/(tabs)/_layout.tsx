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
  const isWeb = Platform.OS === 'web';

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primaryDark,
        tabBarInactiveTintColor: colors.inkLight,
        tabBarStyle: isWeb
          ? {
              backgroundColor: '#FFFFFF',
              position: 'absolute',
              bottom: 12,
              left: 12,
              right: 12,
              height: 64,
              borderRadius: 22,
              borderWidth: 1,
              borderColor: colors.border,
              paddingTop: 6,
              paddingBottom: 6,
              ...shadows.md,
            }
          : {
              backgroundColor: '#FFFFFF',
              borderTopColor: colors.border,
              borderTopWidth: 1,
              height: 60 + insets.bottom,
              paddingTop: 6,
              paddingBottom: Math.max(insets.bottom, 10),
              ...shadows.sm,
            },
        tabBarItemStyle: {
          justifyContent: 'center',
          alignItems: 'center',
          paddingVertical: 2,
        },
        tabBarLabelStyle: {
          fontFamily: fonts.bold,
          fontSize: 11,
          fontWeight: '700',
          marginTop: 2,
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
