import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, SafeAreaView, StatusBar, StyleSheet, Text, TextInput, View } from 'react-native';
import SearchResult from '../components/SearchResult';
import { updatesActions, useUpdates } from '../state/updatesSlice';
import type { ChannelSearchResult } from '../types/updates.types';
import type { RootStackParamList } from '../../../types';
import type { ThemeColors } from '../../../utils/colors';
import { useThemeColors } from '../../../utils/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'ChannelSearchScreen'>;

export default function ChannelSearchScreen({ navigation }: Props) {
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const results = useUpdates((state) => state.searchResults);
  const recentSearches = useUpdates((state) => state.recentSearches);

  useEffect(() => {
    void updatesActions.initialize();
  }, []);

  useEffect(() => {
    const handle = setTimeout(() => {
      setSearching(true);
      void updatesActions.search(query).finally(() => setSearching(false));
    }, 260);

    return () => clearTimeout(handle);
  }, [query]);

  function openResult(result: ChannelSearchResult): void {
    navigation.navigate('ChannelScreen', { channelId: result.channel.id });
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar backgroundColor={colors.background} barStyle={colors.mode === 'dark' ? 'light-content' : 'dark-content'} />
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.iconButton}>
          <Ionicons name="arrow-back" size={22} color={colors.icon} />
        </Pressable>
        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={18} color={colors.textMuted} />
          <TextInput
            autoCapitalize="none"
            autoFocus
            onChangeText={setQuery}
            placeholder="Search channels"
            placeholderTextColor={colors.textMuted}
            style={styles.input}
            value={query}
          />
          {query.length > 0 && (
            <Pressable onPress={() => setQuery('')} style={styles.clearButton}>
              <Ionicons name="close-circle" size={18} color={colors.textMuted} />
            </Pressable>
          )}
        </View>
      </View>
      {query.trim().length === 0 ? (
        <View style={styles.recent}>
          <View style={styles.recentHeader}>
            <Text style={styles.sectionTitle}>Recent searches</Text>
            {recentSearches.length > 0 && (
              <Pressable onPress={() => void updatesActions.clearRecentSearches()}><Text style={styles.clearText}>Clear</Text></Pressable>
            )}
          </View>
          {recentSearches.length === 0 ? <Text style={styles.emptyText}>Search by name, username, or description.</Text> : recentSearches.map((item) => (
            <Pressable key={item} onPress={() => setQuery(item)} style={styles.recentRow}>
              <Ionicons name="time-outline" size={18} color={colors.icon} />
              <Text style={styles.recentText}>{item}</Text>
            </Pressable>
          ))}
        </View>
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item) => item.channel.id}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={searching ? <ActivityIndicator color={colors.primary} style={styles.loader} /> : (
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>No results</Text>
              <Text style={styles.emptyText}>Try another channel name or username.</Text>
            </View>
          )}
          renderItem={({ item }) => <SearchResult colors={colors} onPress={() => openResult(item)} result={item} />}
          style={styles.list}
        />
      )}
    </SafeAreaView>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    clearButton: {
      alignItems: 'center',
      height: 34,
      justifyContent: 'center',
      width: 34,
    },
    clearText: {
      color: colors.primary,
      fontSize: 14,
      fontWeight: '700',
    },
    empty: {
      alignItems: 'center',
      paddingHorizontal: 28,
      paddingVertical: 44,
    },
    emptyText: {
      color: colors.textMuted,
      fontSize: 14,
      lineHeight: 20,
      paddingHorizontal: 16,
    },
    emptyTitle: {
      color: colors.text,
      fontSize: 17,
      fontWeight: '600',
      marginBottom: 6,
    },
    header: {
      alignItems: 'center',
      borderBottomColor: colors.divider,
      borderBottomWidth: StyleSheet.hairlineWidth,
      flexDirection: 'row',
      paddingHorizontal: 6,
      paddingVertical: 8,
    },
    iconButton: {
      alignItems: 'center',
      height: 42,
      justifyContent: 'center',
      width: 42,
    },
    input: {
      color: colors.text,
      flex: 1,
      fontSize: 16,
      minHeight: 40,
      paddingHorizontal: 8,
    },
    list: {
      backgroundColor: colors.background,
      flex: 1,
    },
    loader: {
      marginTop: 32,
    },
    recent: {
      paddingVertical: 12,
    },
    recentHeader: {
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 8,
    },
    recentRow: {
      alignItems: 'center',
      flexDirection: 'row',
      minHeight: 48,
      paddingHorizontal: 16,
    },
    recentText: {
      color: colors.text,
      fontSize: 15,
      marginLeft: 12,
    },
    safeArea: {
      backgroundColor: colors.background,
      flex: 1,
    },
    searchBox: {
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: 20,
      flex: 1,
      flexDirection: 'row',
      paddingLeft: 12,
    },
    sectionTitle: {
      color: colors.textMuted,
      fontSize: 13,
      fontWeight: '700',
      textTransform: 'uppercase',
    },
  });
