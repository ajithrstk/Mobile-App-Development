import { useEffect, useMemo, useState } from 'react';
import { FlatList, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import ChatActionModal from '../components/ChatActionModal';
import ChatItem from '../components/ChatItem';
import FloatingButton from '../components/FloatingButton';
import Header from '../components/Header';
import SearchBar from '../components/SearchBar';
import initialChats from '../data/chats';
import colors from '../utils/colors';

function sortChats(chatList) {
  return [...chatList].sort((first, second) => {
    if (first.pinned === second.pinned) {
      return 0;
    }

    return first.pinned ? -1 : 1;
  });
}

export default function ChatListScreen({ navigation }) {
  const [chats, setChats] = useState(() => sortChats(initialChats));
  const [query, setQuery] = useState('');
  const [selectedChat, setSelectedChat] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    setChats((currentChats) => sortChats(currentChats));
  }, []);

  const filteredChats = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return chats.filter((chat) => {
      if (chat.archived) {
        return false;
      }

      if (!normalizedQuery) {
        return true;
      }

      return (
        chat.name.toLowerCase().includes(normalizedQuery) ||
        chat.lastMessage.toLowerCase().includes(normalizedQuery)
      );
    });
  }, [chats, query]);

  const openChat = (chat) => {
    navigation.navigate('ChatScreen', { chat });
  };

  const openActions = (chat) => {
    setSelectedChat(chat);
    setModalVisible(true);
  };

  const closeActions = () => {
    setModalVisible(false);
    setSelectedChat(null);
  };

  const handleAction = (action) => {
    if (!selectedChat) {
      return;
    }

    setChats((currentChats) => {
      if (action === 'delete') {
        return currentChats.filter((chat) => chat.id !== selectedChat.id);
      }

      const nextChats = currentChats.map((chat) => {
        if (chat.id !== selectedChat.id) {
          return chat;
        }

        if (action === 'pin') {
          return { ...chat, pinned: !chat.pinned };
        }

        if (action === 'mute') {
          return { ...chat, muted: !chat.muted };
        }

        if (action === 'archive') {
          return { ...chat, archived: true };
        }

        return chat;
      });

      return sortChats(nextChats);
    });

    closeActions();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header />
      <View style={styles.container}>
        <SearchBar value={query} onChangeText={setQuery} />
        <FlatList
          data={filteredChats}
          keyExtractor={(item) => item.id}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => (
            <ChatItem chat={item} onPress={openChat} onLongPress={openActions} />
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyTitle}>No chats found</Text>
              <Text style={styles.emptySubtitle}>Try another name or message.</Text>
            </View>
          }
          contentContainerStyle={filteredChats.length === 0 && styles.emptyList}
        />
        <FloatingButton onPress={() => navigation.navigate('ContactsScreen')} />
      </View>
      <ChatActionModal
        visible={modalVisible}
        chat={selectedChat}
        onAction={handleAction}
        onClose={closeActions}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: colors.primary,
    flex: 1,
  },
  container: {
    backgroundColor: colors.background,
    flex: 1,
  },
  emptyList: {
    flexGrow: 1,
  },
  emptyContainer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  emptyTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 6,
  },
  emptySubtitle: {
    color: colors.textMuted,
    fontSize: 14,
    textAlign: 'center',
  },
});
