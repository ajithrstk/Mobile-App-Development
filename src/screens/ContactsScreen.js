import { Ionicons } from '@expo/vector-icons';
import { FlatList, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import colors from '../utils/colors';

const contacts = [
  'Ajith',
  'Yashwanth',
  'Mallika',
  'Bhargavi',
  'Bharath',
  'Sangu Bhargav',
  'Sabari',
  'Suji Sri',
  'Suresh Kumar',
  'Sathish',
  'Naveen',
  'Gokul',
  'Gowsik',
  'Krishna',
  'Seri Seri',
  'Arun',
  'Aj',
  'Ajith Arun',
];

export default function ContactsScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={25} color={colors.icon} />
        </TouchableOpacity>
        <View style={styles.headerText}>
          <Text style={styles.title}>Select contact</Text>
          <Text style={styles.subtitle}>{contacts.length} contacts</Text>
        </View>
        <Ionicons name="search-outline" size={23} color={colors.icon} style={styles.headerIcon} />
      </View>
      <FlatList
        data={contacts}
        keyExtractor={(item) => item}
        renderItem={({ item }) => (
          <View style={styles.contactRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{item.charAt(0)}</Text>
            </View>
            <View style={styles.contactContent}>
              <Text style={styles.contactName}>{item}</Text>
              <Text style={styles.contactStatus}>Available</Text>
            </View>
          </View>
        )}
        style={styles.list}
      />
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
    width: 42,
  },
  headerText: {
    flex: 1,
  },
  title: {
    color: colors.icon,
    fontSize: 19,
    fontWeight: '700',
  },
  subtitle: {
    color: colors.icon,
    fontSize: 12,
    opacity: 0.82,
  },
  headerIcon: {
    marginHorizontal: 12,
  },
  list: {
    backgroundColor: colors.background,
  },
  contactRow: {
    alignItems: 'center',
    flexDirection: 'row',
    minHeight: 74,
    paddingLeft: 16,
  },
  avatar: {
    alignItems: 'center',
    backgroundColor: colors.accent,
    borderRadius: 25,
    height: 50,
    justifyContent: 'center',
    width: 50,
  },
  avatarText: {
    color: colors.badgeText,
    fontSize: 21,
    fontWeight: '700',
  },
  contactContent: {
    borderBottomColor: colors.divider,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flex: 1,
    justifyContent: 'center',
    marginLeft: 14,
    minHeight: 74,
  },
  contactName: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  contactStatus: {
    color: colors.textMuted,
    fontSize: 13,
    marginTop: 4,
  },
});
