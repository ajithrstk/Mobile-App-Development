# Task 6 Native Setup

This implementation keeps native integrations behind modular services so the Expo app can typecheck without importing unavailable native modules directly.

Install these packages before enabling production calling and notifications in a custom dev client or bare React Native build:

```sh
npm install @react-native-async-storage/async-storage @react-native-community/netinfo socket.io-client react-native-webrtc @react-native-firebase/app @react-native-firebase/messaging @notifee/react-native react-native-background-actions
```

Native configuration still required:

- Add Firebase `google-services.json` for Android and `GoogleService-Info.plist` for iOS.
- Enable Push Notifications and Background Modes in the iOS target.
- Add Android notification channels for messages, media, calls, and missed calls.
- Configure microphone and camera usage descriptions on iOS.
- Add Android camera, audio, Bluetooth, foreground service, notification, and network permissions.
- Use a custom Expo development build or prebuild, because WebRTC, Notifee, Firebase Messaging, and background actions do not run inside stock Expo Go.
- Replace the mock socket and call media adapters in `src/services/socket` and `src/calls/services` with backend Socket.IO signaling events when the backend contract is available.
