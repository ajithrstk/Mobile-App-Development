import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import type { ComponentProps } from 'react';
import type { BottomTabParamList } from '../types';
import CallsScreen from '../screens/CallsScreen';
import ChatListScreen from '../screens/ChatListScreen';
import CommunitiesScreen from '../screens/CommunitiesScreen';
import SettingsScreen from '../screens/SettingsScreen';
import UpdatesScreen from '../screens/UpdatesScreen';
import { useThemeColors } from '../utils/colors';

const Tab = createBottomTabNavigator<BottomTabParamList>();

type TabRouteName = keyof BottomTabParamList;
type IoniconName = ComponentProps<typeof Ionicons>['name'];
type MaterialCommunityIconName = ComponentProps<typeof MaterialCommunityIcons>['name'];

function tabIcon(routeName: TabRouteName, color: string, size: number) {
  if (routeName === 'Chats') {
    return <Ionicons name={'chatbubble' as IoniconName} size={size} color={color} />;
  }

  if (routeName === 'Updates') {
    return <Ionicons name={'sync-circle-outline' as IoniconName} size={size + 1} color={color} />;
  }

  if (routeName === 'Communities') {
    return <MaterialCommunityIcons name={'account-group' as MaterialCommunityIconName} size={size + 1} color={color} />;
  }

  if (routeName === 'Calls') {
    return <Ionicons name={'call' as IoniconName} size={size} color={color} />;
  }

  return <Ionicons name={'settings-outline' as IoniconName} size={size} color={color} />;
}

export default function BottomTabNavigator() {
  const colors = useThemeColors();

  return (
    <Tab.Navigator
      initialRouteName="Chats"
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
          textAlign: 'center',
          width: '100%',
        },
        tabBarItemStyle: {
          alignItems: 'center',
          flex: 1,
          justifyContent: 'center',
          minWidth: 0,
        },
        tabBarStyle: {
          backgroundColor: colors.background,
          borderTopColor: colors.divider,
          height: 68,
          paddingBottom: 9,
          paddingHorizontal: 14,
          paddingTop: 5,
        },
        tabBarIcon: ({ color, size }) => tabIcon(route.name, color, size),
      })}
    >
      <Tab.Screen name="Chats" component={ChatListScreen} />
      <Tab.Screen name="Updates" component={UpdatesScreen} />
      <Tab.Screen name="Communities" component={CommunitiesScreen} />
      <Tab.Screen name="Calls" component={CallsScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}
