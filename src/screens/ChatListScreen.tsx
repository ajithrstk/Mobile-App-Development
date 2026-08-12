import { useCallback, useMemo, useState } from 'react';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { FlatList, RefreshControl, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import ChatActionModal from '../components/ChatActionModal';
import ChatItem from '../components/ChatItem';
import FloatingButton from '../components/FloatingButton';
import Header from '../components/Header';
import NetworkStatusBanner from '../components/NetworkStatusBanner';
import SearchBar from '../components/SearchBar';
import SkeletonChatItem from '../components/SkeletonChatItem';
import type { BottomTabParamList, Chat, ChatAction, RootStackParamList } from '../types';
import { chatsActions, useChats } from '../state/chats/chatsStore';
import type { ThemeColors } from '../utils/colors';
import { useTheme } from '../utils/colors';

type ChatListNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<BottomTabParamList, 'Chats'>,
  NativeStackNavigationProp<RootStackParamList>
>;

type ChatListScreenProps = {
  navigation: ChatListNavigationProp;
};

type ChatFilter = 'all' | 'favourites' | 'groups';

const groupChatNames = new Set(['Design Team', 'Family', 'Product Squad', 'Office Lunch', 'Dev Standup', 'College Friends', 'Fitness Group', 'Book Club']);

export default function ChatListScreen({ navigation }: ChatListScreenProps) {
  const { colors, isDarkMode, toggleTheme } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const chats = useChats((state) => state.chats);
  const status = useChats((state) => state.status);
  const error = useChats((state) => state.error);
  const [query, setQuery] = useState('');
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [activeFilter, setActiveFilter] = useState<ChatFilter>('all');

  const archivedCount = useMemo(() => chats.filter((chat) => chat.archived).length, [chats]);
  const filteredChats = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return chats.filter((chat) => {
      if (showArchived ? !chat.archived : chat.archived) {
        return false;
      }

      if (activeFilter === 'favourites' && !chat.pinned) {
        return false;
      }

      if (activeFilter === 'groups' && !groupChatNames.has(chat.name)) {
        return false;
      }

      if (!normalizedQuery) {
        return true;
      }

      return chat.name.toLowerCase().includes(normalizedQuery) || chat.lastMessage.toLowerCase().includes(normalizedQuery);
    });
  }, [activeFilter, chats, query, showArchived]);

  const openActions = (chat: Chat) => {
    setSelectedChat(chat);
    setModalVisible(true);
  };

  const closeActions = () => {
    setModalVisible(false);
    setSelectedChat(null);
  };

  const refreshChats = useCallback(async () => {
    setRefreshing(true);
    await chatsActions.initialize();
    setRefreshing(false);
  }, []);

  const archiveChat = useCallback((targetChat: Chat) => {
    void chatsActions.updatePreference(targetChat.id, 'archived', !targetChat.archived);
  }, []);

  const pinChat = useCallback((targetChat: Chat) => {
    void chatsActions.updatePreference(targetChat.id, 'pinned');
  }, []);

  const handleAction = (action: ChatAction) => {
    if (!selectedChat) {
      return;
    }

    if (action === 'delete') {
      void chatsActions.updatePreference(selectedChat.id, 'archived', true);
    }

    if (action === 'pin') {
      void chatsActions.updatePreference(selectedChat.id, 'pinned');
    }

    if (action === 'mute') {
      void chatsActions.updatePreference(selectedChat.id, 'muted');
    }

    if (action === 'archive') {
      void chatsActions.updatePreference(selectedChat.id, 'archived', !selectedChat.archived);
    }

    closeActions();
  };

  const isLoading = status === 'loading' && chats.length === 0;

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header colors={colors} isDarkMode={isDarkMode} onToggleTheme={toggleTheme} />
      <View style={styles.container}>
        <NetworkStatusBanner colors={colors} />
        {error && <Text style={styles.inlineError}>{error}</Text>}
        <SearchBar value={query} onChangeText={setQuery} colors={colors} />
        <View style={styles.filterRow}>
          {(['all', 'favourites', 'groups'] as ChatFilter[]).map((filter) => (
            <TouchableOpacity
              activeOpacity={0.74}
              key={filter}
              onPress={() => setActiveFilter(filter)}
              style={[styles.filterChip, activeFilter === filter && styles.filterChipActive]}
            >
              <Text style={[styles.filterChipText, activeFilter === filter && styles.filterChipTextActive]}>
                {filter === 'all' ? 'All' : filter === 'favourites' ? 'Favourites' : 'Groups'}
              </Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity
            accessibilityLabel="New filter"
            activeOpacity={0.74}
            onPress={() => navigation.navigate('ContactsScreen')}
            style={styles.addFilterChip}
          >
            <Text style={styles.addFilterText}>+</Text>
          </TouchableOpacity>
        </View>
        {archivedCount > 0 && (
          <TouchableOpacity activeOpacity={0.72} onPress={() => setShowArchived((current) => !current)} style={styles.archiveToggle}>
            <Text style={styles.archiveToggleText}>{showArchived ? 'Back to chats' : 'Archived'}</Text>
            <Text style={styles.archiveToggleCount}>{archivedCount}</Text>
          </TouchableOpacity>
        )}
        {isLoading ? (
          <View>
            {Array.from({ length: 8 }).map((_, index) => <SkeletonChatItem colors={colors} key={index} />)}
          </View>
        ) : (
          <FlatList
            data={filteredChats}
            initialNumToRender={14}
            keyExtractor={(item) => item.id}
            keyboardShouldPersistTaps="handled"
            maxToRenderPerBatch={12}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={refreshChats}
                tintColor={colors.primary}
                colors={[colors.primary]}
                progressBackgroundColor={colors.surface}
              />
            }
            renderItem={({ item }) => (
              <ChatItem
                chat={item}
                onPress={(chat) => navigation.navigate('ChatScreen', { chat })}
                onLongPress={openActions}
                onArchive={archiveChat}
                onPin={pinChat}
                colors={colors}
              />
            )}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyTitle}>{showArchived ? 'No archived chats' : 'No chats found'}</Text>
                <Text style={styles.emptySubtitle}>{showArchived ? 'Archived conversations will appear here.' : 'Try another name or message.'}</Text>
              </View>
            }
            contentContainerStyle={filteredChats.length === 0 ? styles.emptyList : undefined}
            removeClippedSubviews
            windowSize={9}
          />
        )}
        <FloatingButton colors={colors} onPress={() => navigation.navigate('ContactsScreen')} />
      </View>
      <ChatActionModal visible={modalVisible} chat={selectedChat} onAction={handleAction} onClose={closeActions} colors={colors} />
    </SafeAreaView>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    safeArea: { backgroundColor: colors.background, flex: 1 },
    container: { backgroundColor: colors.background, flex: 1 },
    emptyList: { flexGrow: 1 },
    emptyContainer: { alignItems: 'center', flex: 1, justifyContent: 'center', paddingHorizontal: 28 },
    emptyTitle: { color: colors.text, fontSize: 18, fontWeight: '500', marginBottom: 6 },
    emptySubtitle: { color: colors.textMuted, fontSize: 14, textAlign: 'center' },
    archiveToggle: { alignItems: 'center', borderBottomColor: colors.divider, borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: 'row', minHeight: 46, paddingHorizontal: 16 },
    archiveToggleCount: { color: colors.textMuted, fontSize: 13, fontWeight: '500' },
    archiveToggleText: { color: colors.text, flex: 1, fontSize: 15, fontWeight: '500' },
    filterRow: { flexDirection: 'row', paddingBottom: 8, paddingHorizontal: 14 },
    filterChip: { alignItems: 'center', borderColor: colors.divider, borderRadius: 18, borderWidth: 1, justifyContent: 'center', marginRight: 8, minHeight: 36, paddingHorizontal: 16 },
    filterChipActive: { backgroundColor: colors.mode === 'dark' ? '#103529' : '#D9FDD3', borderColor: colors.mode === 'dark' ? '#103529' : '#BCEFC3' },
    filterChipText: { color: colors.textMuted, fontSize: 14, fontWeight: '400' },
    filterChipTextActive: { color: colors.primary, fontWeight: '500' },
    addFilterChip: { alignItems: 'center', borderColor: colors.divider, borderRadius: 18, borderWidth: 1, height: 36, justifyContent: 'center', width: 42 },
    addFilterText: { color: colors.textMuted, fontSize: 24, fontWeight: '300', lineHeight: 28 },
    inlineError: { backgroundColor: colors.surface, color: colors.danger, fontSize: 12, fontWeight: '500', paddingHorizontal: 16, paddingVertical: 8 },
  });
