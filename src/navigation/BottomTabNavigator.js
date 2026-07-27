import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import CallsScreen from '../screens/CallsScreen';
import ChatListScreen from '../screens/ChatListScreen';
import CommunitiesScreen from '../screens/CommunitiesScreen';
import UpdatesScreen from '../screens/UpdatesScreen';
import colors from '../utils/colors';

const Tab = createBottomTabNavigator();

function tabIcon(routeName, color, size) {
  if (routeName === 'Chats') {
    return <Ionicons name="chatbubble" size={size} color={color} />;
  }

  if (routeName === 'Updates') {
    return <Ionicons name="sync-circle-outline" size={size + 1} color={color} />;
  }

  if (routeName === 'Communities') {
    return <MaterialCommunityIcons name="account-group" size={size + 1} color={color} />;
  }

  return <Ionicons name="call" size={size} color={color} />;
}

export default function BottomTabNavigator() {
  return (
    <Tab.Navigator
      initialRouteName="Chats"
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
        tabBarStyle: {
          borderTopColor: colors.divider,
          height: 64,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarIcon: ({ color, size }) => tabIcon(route.name, color, size),
      })}
    >
      <Tab.Screen name="Chats" component={ChatListScreen} />
      <Tab.Screen name="Updates" component={UpdatesScreen} />
      <Tab.Screen name="Communities" component={CommunitiesScreen} />
      <Tab.Screen name="Calls" component={CallsScreen} />
    </Tab.Navigator>
  );
}
