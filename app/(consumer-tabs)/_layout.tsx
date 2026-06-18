import { Tabs } from 'expo-router';
import { Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../../constants/Colors';

export default function ConsumerTabsLayout() {
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
        name="discover"
        options={{
          title: 'Discover',
          tabBarIcon: ({ color }) => <Ionicons name="search-outline" size={22} color={color as string} />,
        }}
      />
      <Tabs.Screen
        name="bookings"
        options={{
          title: 'Bookings',
          tabBarIcon: ({ color }) => <Ionicons name="calendar-outline" size={22} color={color as string} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <Ionicons name="person-outline" size={22} color={color as string} />,
        }}
      />
    </Tabs>
  );
}
