import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types';
import BottomTabNavigator from './BottomTabNavigator';
import ChatScreen from '../screens/ChatScreen';
import ChatInfoScreen from '../screens/ChatInfoScreen';
import ContactsScreen from '../screens/ContactsScreen';
import EditProfileScreen from '../screens/EditProfileScreen';
import EnterpriseDashboardScreen from '../screens/EnterpriseDashboardScreen';
import ForwardSelectionScreen from '../screens/ForwardSelectionScreen';
import GlobalSearchScreen from '../screens/GlobalSearchScreen';
import GroupsScreen from '../screens/GroupsScreen';
import MediaViewerScreen from '../screens/MediaViewerScreen';
import MediaLinksDocsScreen from '../screens/MediaLinksDocsScreen';
import CallDetailsScreen from '../screens/CallDetailsScreen';
import CallHistoryScreen from '../screens/CallHistoryScreen';
import CallScreen from '../screens/CallScreen';
import IncomingCallScreen from '../screens/IncomingCallScreen';
import BroadcastListScreen from '../features/updates/screens/BroadcastListScreen';
import ChannelAdminScreen from '../features/updates/screens/ChannelAdminScreen';
import ChannelInfoScreen from '../features/updates/screens/ChannelInfoScreen';
import ChannelScreen from '../features/updates/screens/ChannelScreen';
import ChannelSearchScreen from '../features/updates/screens/ChannelSearchScreen';
import CreateChannelScreen from '../features/updates/screens/CreateChannelScreen';
import CreateStatusScreen from '../features/status/screens/CreateStatusScreen';
import NotificationSettingsScreen from '../screens/NotificationSettingsScreen';
import SettingSectionScreen from '../screens/SettingSectionScreen';
import SettingsScreen from '../screens/SettingsScreen';
import StorageScreen from '../screens/StorageScreen';
import StatusViewerScreen from '../features/status/screens/StatusViewerScreen';
import StarredMessagesScreen from '../screens/StarredMessagesScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function ChatNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MainTabs" component={BottomTabNavigator} />
      <Stack.Screen name="ChatScreen" component={ChatScreen} />
      <Stack.Screen name="ContactsScreen" component={ContactsScreen} />
      <Stack.Screen name="GlobalSearchScreen" component={GlobalSearchScreen} />
      <Stack.Screen name="GroupsScreen" component={GroupsScreen} />
      <Stack.Screen name="EnterpriseDashboardScreen" component={EnterpriseDashboardScreen} />
      <Stack.Screen name="ForwardSelectionScreen" component={ForwardSelectionScreen} />
      <Stack.Screen name="StarredMessagesScreen" component={StarredMessagesScreen} />
      <Stack.Screen name="ChatInfoScreen" component={ChatInfoScreen} />
      <Stack.Screen name="MediaLinksDocsScreen" component={MediaLinksDocsScreen} />
      <Stack.Screen name="MediaViewerScreen" component={MediaViewerScreen} />
      <Stack.Screen name="CallScreen" component={CallScreen} />
      <Stack.Screen name="IncomingCallScreen" component={IncomingCallScreen} />
      <Stack.Screen name="CallHistoryScreen" component={CallHistoryScreen} />
      <Stack.Screen name="CallDetailsScreen" component={CallDetailsScreen} />
      <Stack.Screen name="SettingsScreen" component={SettingsScreen} />
      <Stack.Screen name="EditProfileScreen" component={EditProfileScreen} />
      <Stack.Screen name="NotificationSettingsScreen" component={NotificationSettingsScreen} />
      <Stack.Screen name="StorageScreen" component={StorageScreen} />
      <Stack.Screen name="SettingSectionScreen" component={SettingSectionScreen} />
      <Stack.Screen name="CreateStatusScreen" component={CreateStatusScreen} />
      <Stack.Screen name="StatusViewerScreen" component={StatusViewerScreen} />
      <Stack.Screen name="ChannelScreen" component={ChannelScreen} />
      <Stack.Screen name="ChannelInfoScreen" component={ChannelInfoScreen} />
      <Stack.Screen name="CreateChannelScreen" component={CreateChannelScreen} />
      <Stack.Screen name="ChannelAdminScreen" component={ChannelAdminScreen} />
      <Stack.Screen name="BroadcastListScreen" component={BroadcastListScreen} />
      <Stack.Screen name="ChannelSearchScreen" component={ChannelSearchScreen} />
    </Stack.Navigator>
  );
}
