import { Ionicons } from '@expo/vector-icons';
import { Image, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import colors from '../utils/colors';

export default function ChatScreen({ navigation, route }) {
  const chat = route.params?.chat;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={25} color={colors.icon} />
        </TouchableOpacity>
        {chat?.avatar && <Image source={chat.avatar} style={styles.avatar} />}
        <View style={styles.headerText}>
          <Text numberOfLines={1} style={styles.name}>{chat?.name || 'Chat'}</Text>
          <Text style={styles.status}>online</Text>
        </View>
        <Ionicons name="videocam-outline" size={23} color={colors.icon} style={styles.headerIcon} />
        <Ionicons name="call-outline" size={22} color={colors.icon} style={styles.headerIcon} />
      </View>
      <View style={styles.body}>
        <View style={styles.incomingBubble}>
          <Text style={styles.messageText}>{chat?.lastMessage || 'Hello there.'}</Text>
        </View>
        <View style={styles.outgoingBubble}>
          <Text style={styles.messageText}>Got it. I will reply here.</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: colors.primary,
    flex: 1,
  },
  header: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    flexDirection: 'row',
    minHeight: 64,
    paddingHorizontal: 8,
  },
  backButton: {
    alignItems: 'center',
    height: 44,
    justifyContent: 'center',
    width: 40,
  },
  avatar: {
    borderRadius: 19,
    height: 38,
    marginRight: 10,
    width: 38,
  },
  headerText: {
    flex: 1,
  },
  name: {
    color: colors.icon,
    fontSize: 17,
    fontWeight: '700',
  },
  status: {
    color: colors.icon,
    fontSize: 12,
    opacity: 0.82,
  },
  headerIcon: {
    marginHorizontal: 9,
  },
  body: {
    backgroundColor: '#EFE7DC',
    flex: 1,
    padding: 16,
  },
  incomingBubble: {
    alignSelf: 'flex-start',
    backgroundColor: colors.background,
    borderRadius: 8,
    marginBottom: 12,
    maxWidth: '82%',
    padding: 12,
  },
  outgoingBubble: {
    alignSelf: 'flex-end',
    backgroundColor: '#DCF8C6',
    borderRadius: 8,
    maxWidth: '82%',
    padding: 12,
  },
  messageText: {
    color: colors.text,
    fontSize: 15,
  },
});
