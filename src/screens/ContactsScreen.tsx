import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useMemo, useRef, useState } from 'react';
import {
  Alert,
  Platform,
  RefreshControl,
  SafeAreaView,
  SectionList,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import ContactActionSheet from '../components/ContactActionSheet';
import ContactListItem from '../components/ContactListItem';
import SearchBar from '../components/SearchBar';
import { getContactChat } from '../data/contacts';
import { useContacts } from '../hooks/useContacts';
import type { RootStackParamList } from '../types';
import type { ContactAction, ContactProfile } from '../types/contact';
import type { ThemeColors } from '../utils/colors';
import { useThemeColors } from '../utils/colors';

type ContactsScreenProps = NativeStackScreenProps<RootStackParamList, 'ContactsScreen'>;

type QuickAction = {
  label: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
};

const androidTopInset = Platform.OS === 'android' ? StatusBar.currentHeight ?? 0 : 0;

const quickActions: QuickAction[] = [
  { label: 'New Group', subtitle: 'Start a shared chat', icon: 'people' },
  { label: 'New Community', subtitle: 'Bring groups together', icon: 'megaphone' },
  { label: 'New Contact', subtitle: 'Add phone number', icon: 'person-add' },
];

export default function ContactsScreen({ navigation }: ContactsScreenProps) {
  const colors = useThemeColors();
  const { width } = useWindowDimensions();
  const isCompact = width < 370;
  const styles = useMemo(() => createStyles(colors, isCompact), [colors, isCompact]);
  const searchInputRef = useRef<TextInput>(null);
  const {
    allContactsCount,
    favoriteContacts,
    hasMoreContacts,
    loadMoreContacts,
    query,
    recentContacts,
    refreshing,
    refreshContacts,
    resultCount,
    sections,
    setQuery,
  } = useContacts();
  const [selectedContact, setSelectedContact] = useState<ContactProfile | null>(null);
  const hasSearchQuery = query.trim().length > 0;

  const openContact = (contact: ContactProfile) => {
    navigation.navigate('ChatScreen', { chat: getContactChat(contact) });
  };

  const openContactActions = (contact: ContactProfile) => {
    setSelectedContact(contact);
  };

  const closeContactActions = () => {
    setSelectedContact(null);
  };

  const handleQuickAction = (action: QuickAction) => {
    Alert.alert(action.label, `${action.label} UI is ready.`);
  };

  const handleMenuPress = () => {
    Alert.alert('New Chat', 'Choose a contact, refresh the list, or invite friends.');
  };

  const handleContactAction = (action: ContactAction, contact: ContactProfile) => {
    const actionLabels: Record<ContactAction, string> = {
      profile: 'Profile',
      invite: 'Invite Contact',
      block: 'Block Contact',
    };

    Alert.alert(actionLabels[action], `${actionLabels[action]} option selected for ${contact.name}.`);
    closeContactActions();
  };

  const renderQuickAction = (action: QuickAction) => (
    <TouchableOpacity
      activeOpacity={0.74}
      key={action.label}
      onPress={() => handleQuickAction(action)}
      style={styles.quickAction}
    >
      <View style={styles.quickActionIcon}>
        <Ionicons name={action.icon} size={23} color={colors.badgeText} />
      </View>
      <View style={styles.quickActionText}>
        <Text style={styles.quickActionLabel}>{action.label}</Text>
        <Text numberOfLines={1} style={styles.quickActionSubtitle}>
          {action.subtitle}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderFavoriteContacts = () => {
    if (favoriteContacts.length === 0 || hasSearchQuery) {
      return null;
    }

    return (
      <View style={styles.favoriteSection}>
        <Text style={styles.stripTitle}>Favorites</Text>
        {favoriteContacts.map((contact) => (
          <ContactListItem
            colors={colors}
            contact={contact}
            key={`Favorites-${contact.id}`}
            onLongPress={openContactActions}
            onPress={openContact}
          />
        ))}
      </View>
    );
  };

  const renderRecentContacts = () => {
    if (recentContacts.length === 0 || hasSearchQuery) {
      return null;
    }

    return (
      <View style={styles.recentSection}>
        <Text style={styles.stripTitle}>Recently contacted</Text>
        {recentContacts.map((contact) => (
          <ContactListItem
            colors={colors}
            contact={contact}
            key={`Recently contacted-${contact.id}`}
            onLongPress={openContactActions}
            onPress={openContact}
          />
        ))}
      </View>
    );
  };

  const listHeader = (
    <View>
      <View style={styles.searchShell}>
        <SearchBar
          colors={colors}
          onChangeText={setQuery}
          placeholder="Search name or number"
          ref={searchInputRef}
          value={query}
        />
      </View>
      {!hasSearchQuery && <View style={styles.quickActions}>{quickActions.map(renderQuickAction)}</View>}
      {renderFavoriteContacts()}
      {renderRecentContacts()}
      <View style={styles.contactsSummary}>
        <Text style={styles.contactsSummaryText}>
          {hasSearchQuery ? `${resultCount} result${resultCount === 1 ? '' : 's'}` : `${allContactsCount} contacts`}
        </Text>
      </View>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIcon}>
        <Ionicons name="search-outline" size={30} color={colors.textMuted} />
      </View>
      <Text style={styles.emptyTitle}>No contacts found</Text>
      <Text style={styles.emptySubtitle}>Try a different name or phone number.</Text>
    </View>
  );

  const renderFooter = () => {
    if (hasSearchQuery) {
      return null;
    }

    return (
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          {hasMoreContacts ? 'Loading more contacts...' : 'All contacts loaded'}
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={25} color={colors.icon} />
        </TouchableOpacity>
        <View style={styles.headerText}>
          <Text style={styles.title}>New chat</Text>
          <Text style={styles.subtitle}>{allContactsCount} contacts</Text>
        </View>
        <TouchableOpacity activeOpacity={0.72} onPress={() => searchInputRef.current?.focus()} style={styles.iconButton}>
          <Ionicons name="search-outline" size={23} color={colors.icon} />
        </TouchableOpacity>
        <TouchableOpacity activeOpacity={0.72} onPress={handleMenuPress} style={styles.iconButton}>
          <Ionicons name="ellipsis-vertical" size={22} color={colors.icon} />
        </TouchableOpacity>
      </View>
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        keyboardShouldPersistTaps="handled"
        onEndReached={loadMoreContacts}
        onEndReachedThreshold={0.45}
        refreshControl={
          <RefreshControl
            colors={[colors.primary]}
            onRefresh={refreshContacts}
            progressBackgroundColor={colors.surface}
            refreshing={refreshing}
            tintColor={colors.primary}
          />
        }
        renderItem={({ item }) => (
          <ContactListItem
            colors={colors}
            contact={item}
            onLongPress={openContactActions}
            onPress={openContact}
          />
        )}
        renderSectionHeader={({ section }) => (
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionHeaderText}>{section.title}</Text>
          </View>
        )}
        stickySectionHeadersEnabled
        ListHeaderComponent={listHeader}
        ListEmptyComponent={renderEmptyState}
        ListFooterComponent={renderFooter}
        contentContainerStyle={sections.length === 0 ? styles.emptyList : styles.listContent}
        showsVerticalScrollIndicator={false}
      />
      <ContactActionSheet
        colors={colors}
        contact={selectedContact}
        onAction={handleContactAction}
        onClose={closeContactActions}
        visible={selectedContact !== null}
      />
    </SafeAreaView>
  );
}

const createStyles = (colors: ThemeColors, isCompact: boolean) =>
  StyleSheet.create({
    safeArea: {
      backgroundColor: colors.background,
      flex: 1,
    },
    header: {
      alignItems: 'center',
      backgroundColor: colors.background,
      borderBottomColor: colors.divider,
      borderBottomWidth: StyleSheet.hairlineWidth,
      flexDirection: 'row',
      minHeight: 64 + androidTopInset,
      paddingHorizontal: 6,
      paddingTop: androidTopInset,
    },
    backButton: {
      alignItems: 'center',
      height: 44,
      justifyContent: 'center',
      width: 42,
    },
    iconButton: {
      alignItems: 'center',
      height: 44,
      justifyContent: 'center',
      width: 42,
    },
    headerText: {
      flex: 1,
      minWidth: 0,
    },
    title: {
      color: colors.text,
      fontSize: 19,
      fontWeight: '400',
    },
    subtitle: {
      color: colors.textMuted,
      fontSize: 12,
      marginTop: 2,
    },
    searchShell: {
      backgroundColor: colors.background,
      paddingTop: 2,
    },
    quickActions: {
      backgroundColor: colors.background,
      paddingBottom: 6,
      paddingTop: 2,
    },
    quickAction: {
      alignItems: 'center',
      flexDirection: 'row',
      minHeight: isCompact ? 58 : 62,
      paddingHorizontal: 16,
    },
    quickActionIcon: {
      alignItems: 'center',
      backgroundColor: colors.accent,
      borderRadius: 23,
      height: 46,
      justifyContent: 'center',
      width: 46,
    },
    quickActionText: {
      borderBottomColor: colors.divider,
      borderBottomWidth: StyleSheet.hairlineWidth,
      flex: 1,
      justifyContent: 'center',
      marginLeft: 14,
      minHeight: isCompact ? 58 : 62,
      minWidth: 0,
    },
    quickActionLabel: {
      color: colors.text,
      fontSize: 16,
      fontWeight: '500',
    },
    quickActionSubtitle: {
      color: colors.textMuted,
      fontSize: 13,
      marginTop: 3,
    },
    favoriteSection: {
      backgroundColor: colors.background,
      paddingTop: 8,
    },
    recentSection: {
      backgroundColor: colors.background,
      paddingTop: 8,
    },
    stripTitle: {
      color: colors.textMuted,
      fontSize: 13,
      fontWeight: '500',
      paddingHorizontal: 16,
      textTransform: 'uppercase',
    },
    contactsSummary: {
      backgroundColor: colors.background,
      borderTopColor: colors.divider,
      borderTopWidth: StyleSheet.hairlineWidth,
      paddingHorizontal: 16,
      paddingVertical: 11,
    },
    contactsSummaryText: {
      color: colors.textMuted,
      fontSize: 13,
      fontWeight: '500',
      textTransform: 'uppercase',
    },
    listContent: {
      backgroundColor: colors.background,
      paddingBottom: 18,
    },
    emptyList: {
      backgroundColor: colors.background,
      flexGrow: 1,
    },
    sectionHeader: {
      backgroundColor: colors.surface,
      justifyContent: 'center',
      minHeight: 30,
      paddingHorizontal: 16,
    },
    sectionHeaderText: {
      color: colors.primary,
      fontSize: 13,
      fontWeight: '500',
    },
    emptyContainer: {
      alignItems: 'center',
      flex: 1,
      justifyContent: 'center',
      paddingHorizontal: 28,
      paddingVertical: 70,
    },
    emptyIcon: {
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: 28,
      height: 56,
      justifyContent: 'center',
      marginBottom: 14,
      width: 56,
    },
    emptyTitle: {
      color: colors.text,
      fontSize: 18,
      fontWeight: '500',
      marginBottom: 6,
    },
    emptySubtitle: {
      color: colors.textMuted,
      fontSize: 14,
      textAlign: 'center',
    },
    footer: {
      alignItems: 'center',
      backgroundColor: colors.background,
      paddingBottom: 24,
      paddingTop: 14,
    },
    footerText: {
      color: colors.textMuted,
      fontSize: 13,
      fontWeight: '500',
    },
  });
