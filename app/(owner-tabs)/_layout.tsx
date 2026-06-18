import { Tabs } from 'expo-router';
import { Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../../constants/Colors';

export default function OwnerTabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor:   Colors.rose,
        tabBarInactiveTintColor: Colors.soft,
        tabBarStyle: {
          backgroundColor: Colors.white,
          borderTopColor: Colors.border,
          borderTopWidth: 1,
          paddingBottom: Platform.OS === 'ios' ? 4 : 8,
          height: Platform.OS === 'ios' ? 82 : 62,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
          marginBottom: 2,
        },
      }}
    >
      <Tabs.Screen
        name="calendar"
        options={{
          title: 'Calendar',
          tabBarIcon: ({ color }) => <Ionicons name="calendar-outline" size={22} color={color as string} />,
        }}
      />
      <Tabs.Screen
        name="clients"
        options={{
          title: 'Clients',
          tabBarIcon: ({ color }) => <Ionicons name="people-outline" size={22} color={color as string} />,
        }}
      />
      <Tabs.Screen
        name="services"
        options={{
          title: 'Services',
          tabBarIcon: ({ color }) => <Ionicons name="cut-outline" size={22} color={color as string} />,
        }}
      />
      <Tabs.Screen
        name="finances"
        options={{
          title: 'Finances',
          tabBarIcon: ({ color }) => <Ionicons name="bar-chart-outline" size={22} color={color as string} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color }) => <Ionicons name="settings-outline" size={22} color={color as string} />,
        }}
      />
    </Tabs>
  );
}
