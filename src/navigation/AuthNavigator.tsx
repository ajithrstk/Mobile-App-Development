import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../types';
import LoginScreen from '../screens/auth/LoginScreen';
import OTPVerificationScreen from '../screens/auth/OTPVerificationScreen';
import ProfileSetupScreen from '../screens/auth/ProfileSetupScreen';

const Stack = createNativeStackNavigator<AuthStackParamList>();

type AuthNavigatorProps = {
  initialRouteName?: keyof AuthStackParamList;
};

export default function AuthNavigator({ initialRouteName = 'LoginScreen' }: AuthNavigatorProps) {
  return (
    <Stack.Navigator initialRouteName={initialRouteName} screenOptions={{ headerShown: false }}>
      <Stack.Screen name="LoginScreen" component={LoginScreen} />
      <Stack.Screen name="OTPVerificationScreen" component={OTPVerificationScreen} />
      <Stack.Screen name="ProfileSetupScreen" component={ProfileSetupScreen} />
    </Stack.Navigator>
  );
}
