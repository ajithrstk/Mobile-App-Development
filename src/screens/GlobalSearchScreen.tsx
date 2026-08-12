import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { ComponentProps } from 'react';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Linking,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import SearchBar from '../components/SearchBar';
import { getContactChat } from '../data/contacts';
import { updatesActions, useUpdates } from '../features/updates/state/updatesSlice';
import { useChats } from '../state/chats/chatsStore';
import type { RootStackParamList } from '../types';
import type { ThemeColors } from '../utils/colors';
import { useThemeColors } from '../utils/colors';
import { formatMessageTime } from '../utils/chat';
import {
  buildSuggestions,
  clearRecentSearches,
  dateFilterLabels,
  getRecentSearches,
  messageKindLabels,
  saveRecentSearch,
  searchFilterLabels,
  searchLocally,
  type DateFilter,
  type GlobalSearchResult,
  type SearchFilter,
} from '../search/searchService';

type GlobalSearchScreenProps = NativeStackScreenProps<RootStackParamList, 'GlobalSearchScreen'>;
type IoniconName = ComponentProps<typeof Ionicons>['name'];
type MaterialIconName = ComponentProps<typeof MaterialCommunityIcons>['name'];

const PAGE_SIZE = 24;
const FILTERS: SearchFilter[] = ['photos', 'videos', 'documents', 'links', 'audio', 'gifs', 'contacts', 'location', 'polls', 'starred'];
const DATE_FILTERS: DateFilter[] = ['all', 'today', 'yesterday', 'last7', 'last30', 'custom'];

const typeIcons: Record<GlobalSearchResult['type'], { ion?: IoniconName; material?: MaterialIconName }> = {
  channel: { ion: 'megaphone-outline' },
  contact: { ion: 'person-outline' },
  document: { material: 'file-document-outline' },
  group: { material: 'account-group-outline' },
  link: { ion: 'link-outline' },
  media: { ion: 'images-outline' },
  message: { ion: 'chatbubble-outline' },
};

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function HighlightedText({ colors, query, text, style }: { colors: ThemeColors; query: string; text: string; style: object }) {
  const trimmed = query.trim();

  if (!trimmed) {
    return <Text numberOfLines={2} style={style}>{text}</Text>;
  }

  const parts = text.split(new RegExp(`(${escapeRegExp(trimmed)})`, 'ig'));

  return (
    <Text numberOfLines={2} style={style}>
      {parts.map((part, index) => (
        part.toLowerCase() === trimmed.toLowerCase()
          ? <Text key={`${part}-${index}`} style={{ backgroundColor: colors.mode === 'dark' ? '#726514' : '#FFE066', color: colors.text }}>{part}</Text>
          : part
      ))}
    </Text>
  );
}

const SearchResultRow = memo(function SearchResultRow({
  colors,
  onPress,
  query,
  result,
}: {
  colors: ThemeColors;
  onPress: (result: GlobalSearchResult) => void;
  query: string;
  result: GlobalSearchResult;
}) {
  const styles = createStyles(colors);
  const icon = typeIcons[result.type];
  const messageKind = result.message ? messageKindLabels[result.message.kind] : result.type;

  return (
    <TouchableOpacity activeOpacity={0.74} onPress={() => onPress(result)} style={styles.resultRow}>
      {result.message?.image ? (
        <Image source={result.message.image} style={styles.thumbnail} />
      ) : (
        <View style={styles.resultIcon}>
          {icon.ion && <Ionicons name={icon.ion} size={23} color={colors.primary} />}
          {icon.material && <MaterialCommunityIcons name={icon.material} size={24} color={colors.primary} />}
        </View>
      )}
      <View style={styles.resultText}>
        <View style={styles.resultTitleRow}>
          <HighlightedText colors={colors} query={query} style={styles.resultTitle} text={result.title} />
          {result.timestamp && <Text style={styles.resultTime}>{formatMessageTime(result.timestamp)}</Text>}
        </View>
        <Text numberOfLines={1} style={styles.resultMeta}>
          {messageKind.charAt(0).toUpperCase() + messageKind.slice(1)} - {result.subtitle}
        </Text>
        {result.body && <HighlightedText colors={colors} query={query} style={styles.resultBody} text={result.body} />}
        {result.domain && <Text numberOfLines={1} style={styles.domain}>{result.domain}</Text>}
      </View>
    </TouchableOpacity>
  );
});

export default function GlobalSearchScreen({ navigation }: GlobalSearchScreenProps) {
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const chats = useChats((state) => state.chats);
  const channels = useUpdates((state) => state.channels);
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [filters, setFilters] = useState<SearchFilter[]>([]);
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [results, setResults] = useState<GlobalSearchResult[]>([]);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const searchInputRef = useRef<TextInput>(null);

  const hasSearchIntent = query.trim().length > 0 || filters.length > 0 || dateFilter !== 'all';
  const visibleResults = useMemo(() => results.slice(0, visibleCount), [results, visibleCount]);
  const suggestions = useMemo(() => buildSuggestions(recentSearches, query, chats, channels), [chats, channels, query, recentSearches]);

  useEffect(() => {
    void getRecentSearches().then(setRecentSearches);
    if (channels.length === 0) {
      void updatesActions.initialize();
    }
  }, [channels.length]);

  useEffect(() => {
    setLoading(hasSearchIntent);
    const timer = setTimeout(() => setDebouncedQuery(query), 280);
    return () => clearTimeout(timer);
  }, [hasSearchIntent, query]);

  useEffect(() => {
    let mounted = true;

    async function runSearch() {
      if (!hasSearchIntent) {
        setResults([]);
        setLoading(false);
        setError(null);
        return;
      }

      try {
        setLoading(true);
        const nextResults = await searchLocally({
          channels,
          chats,
          customEnd,
          customStart,
          dateFilter,
          filters,
          query: debouncedQuery,
        });

        if (mounted) {
          setResults(nextResults);
          setVisibleCount(PAGE_SIZE);
          setError(null);
        }
      } catch {
        if (mounted) {
          setError('Could not search local data. Please try again.');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    void runSearch();

    return () => {
      mounted = false;
    };
  }, [channels, chats, customEnd, customStart, dateFilter, debouncedQuery, filters, hasSearchIntent]);

  const toggleFilter = useCallback((filter: SearchFilter) => {
    setFilters((current) => current.includes(filter) ? current.filter((item) => item !== filter) : [...current, filter]);
  }, []);

  const commitSearch = useCallback(async (value: string) => {
    const nextRecentSearches = await saveRecentSearch(value);
    setRecentSearches(nextRecentSearches);
  }, []);

  const openResult = useCallback(
    (result: GlobalSearchResult) => {
      void commitSearch(query || result.title);

      if (result.message && result.chat) {
        navigation.navigate('ChatScreen', {
          chat: result.chat,
          searchQuery: query,
          targetMessageId: result.message.id,
        });
        return;
      }

      if (result.chat) {
        navigation.navigate('ChatScreen', { chat: result.chat });
        return;
      }

      if (result.contact) {
        navigation.navigate('ChatScreen', { chat: getContactChat(result.contact) });
        return;
      }

      if (result.channel) {
        navigation.navigate('ChannelScreen', { channelId: result.channel.id });
        return;
      }

      if (result.url) {
        void Linking.openURL(result.url);
      }
    },
    [commitSearch, navigation, query],
  );

  const clearHistory = useCallback(async () => {
    await clearRecentSearches();
    setRecentSearches([]);
  }, []);

  const chooseSuggestion = useCallback((suggestion: string) => {
    setQuery(suggestion);
    void commitSearch(suggestion);
  }, [commitSearch]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconButton}>
          <Ionicons name="arrow-back" size={24} color={colors.icon} />
        </TouchableOpacity>
        <View style={styles.searchWrap}>
          <SearchBar
            ref={searchInputRef}
            colors={colors}
            onChangeText={setQuery}
            placeholder="Search"
            value={query}
          />
        </View>
      </View>
      <View style={styles.body}>
        <View style={styles.filterBlock}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
            {FILTERS.map((filter) => (
              <TouchableOpacity
                activeOpacity={0.74}
                key={filter}
                onPress={() => toggleFilter(filter)}
                style={[styles.filterChip, filters.includes(filter) && styles.filterChipActive]}
              >
                <Text style={[styles.filterChipText, filters.includes(filter) && styles.filterChipTextActive]}>
                  {searchFilterLabels[filter]}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
            {DATE_FILTERS.map((filter) => (
              <TouchableOpacity
                activeOpacity={0.74}
                key={filter}
                onPress={() => setDateFilter(filter)}
                style={[styles.dateChip, dateFilter === filter && styles.filterChipActive]}
              >
                <Text style={[styles.filterChipText, dateFilter === filter && styles.filterChipTextActive]}>
                  {dateFilterLabels[filter]}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          {dateFilter === 'custom' && (
            <View style={styles.customDateRow}>
              <TextInput
                autoCapitalize="none"
                onChangeText={setCustomStart}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={colors.textMuted}
                style={styles.dateInput}
                value={customStart}
              />
              <Text style={styles.dateDash}>to</Text>
              <TextInput
                autoCapitalize="none"
                onChangeText={setCustomEnd}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={colors.textMuted}
                style={styles.dateInput}
                value={customEnd}
              />
            </View>
          )}
        </View>

        {!hasSearchIntent ? (
          <ScrollView keyboardShouldPersistTaps="handled" style={styles.suggestions}>
            {recentSearches.length > 0 && (
              <View style={styles.suggestionHeader}>
                <Text style={styles.sectionTitle}>Recent searches</Text>
                <TouchableOpacity onPress={clearHistory}>
                  <Text style={styles.clearText}>Clear</Text>
                </TouchableOpacity>
              </View>
            )}
            {recentSearches.map((item) => (
              <TouchableOpacity activeOpacity={0.72} key={item} onPress={() => chooseSuggestion(item)} style={styles.suggestionRow}>
                <Ionicons name="time-outline" size={21} color={colors.textMuted} />
                <Text numberOfLines={1} style={styles.suggestionText}>{item}</Text>
              </TouchableOpacity>
            ))}
            <Text style={styles.sectionTitle}>Suggestions</Text>
            {suggestions.map((item) => (
              <TouchableOpacity activeOpacity={0.72} key={item} onPress={() => chooseSuggestion(item)} style={styles.suggestionRow}>
                <Ionicons name="search-outline" size={21} color={colors.textMuted} />
                <Text numberOfLines={1} style={styles.suggestionText}>{item}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        ) : (
          <FlatList
            data={visibleResults}
            initialNumToRender={14}
            keyboardShouldPersistTaps="handled"
            keyExtractor={(item) => `${item.type}-${item.id}`}
            maxToRenderPerBatch={12}
            onEndReached={() => setVisibleCount((current) => Math.min(current + PAGE_SIZE, results.length))}
            onEndReachedThreshold={0.35}
            renderItem={({ item }) => <SearchResultRow colors={colors} onPress={openResult} query={debouncedQuery} result={item} />}
            removeClippedSubviews
            windowSize={9}
            ListHeaderComponent={
              <View style={styles.resultHeader}>
                <Text style={styles.resultCount}>{results.length} result{results.length === 1 ? '' : 's'}</Text>
                {loading && <ActivityIndicator color={colors.primary} size="small" />}
              </View>
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                {loading ? (
                  <>
                    <ActivityIndicator color={colors.primary} size="large" />
                    <Text style={styles.emptyTitle}>Searching</Text>
                  </>
                ) : error ? (
                  <>
                    <Ionicons name="warning-outline" size={36} color={colors.danger} />
                    <Text style={styles.emptyTitle}>{error}</Text>
                  </>
                ) : (
                  <>
                    <Ionicons name="search-outline" size={36} color={colors.textMuted} />
                    <Text style={styles.emptyTitle}>No results found</Text>
                    <Text style={styles.emptySubtitle}>Try another keyword, sender, chat, date or filter.</Text>
                  </>
                )}
              </View>
            }
            contentContainerStyle={visibleResults.length === 0 ? styles.emptyList : undefined}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    safeArea: { backgroundColor: colors.background, flex: 1 },
    header: {
      alignItems: 'center',
      backgroundColor: colors.background,
      borderBottomColor: colors.divider,
      borderBottomWidth: StyleSheet.hairlineWidth,
      flexDirection: 'row',
      minHeight: 62,
      paddingHorizontal: 8,
    },
    iconButton: { alignItems: 'center', height: 44, justifyContent: 'center', width: 42 },
    searchWrap: { flex: 1, marginLeft: -8 },
    body: { backgroundColor: colors.background, flex: 1 },
    filterBlock: { borderBottomColor: colors.divider, borderBottomWidth: StyleSheet.hairlineWidth, paddingBottom: 6 },
    chipRow: { paddingHorizontal: 14, paddingTop: 10 },
    filterChip: {
      alignItems: 'center',
      borderColor: colors.divider,
      borderRadius: 18,
      borderWidth: 1,
      justifyContent: 'center',
      marginRight: 8,
      minHeight: 36,
      paddingHorizontal: 14,
    },
    dateChip: {
      alignItems: 'center',
      borderColor: colors.divider,
      borderRadius: 18,
      borderWidth: 1,
      justifyContent: 'center',
      marginRight: 8,
      minHeight: 34,
      paddingHorizontal: 13,
    },
    filterChipActive: { backgroundColor: colors.mode === 'dark' ? '#103529' : '#D9FDD3', borderColor: colors.mode === 'dark' ? '#103529' : '#BCEFC3' },
    filterChipText: { color: colors.textMuted, fontSize: 14, fontWeight: '400' },
    filterChipTextActive: { color: colors.primary, fontWeight: '600' },
    customDateRow: { alignItems: 'center', flexDirection: 'row', paddingHorizontal: 14, paddingTop: 10 },
    dateInput: { backgroundColor: colors.surface, borderRadius: 8, color: colors.text, flex: 1, fontSize: 14, minHeight: 40, paddingHorizontal: 12 },
    dateDash: { color: colors.textMuted, fontSize: 13, marginHorizontal: 10 },
    suggestions: { flex: 1 },
    suggestionHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', paddingRight: 18 },
    sectionTitle: { color: colors.textMuted, fontSize: 13, fontWeight: '600', paddingHorizontal: 18, paddingTop: 18, textTransform: 'uppercase' },
    clearText: { color: colors.primary, fontSize: 14, fontWeight: '600', paddingTop: 18 },
    suggestionRow: { alignItems: 'center', flexDirection: 'row', minHeight: 48, paddingHorizontal: 18 },
    suggestionText: { color: colors.text, flex: 1, fontSize: 16, marginLeft: 14 },
    resultHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', minHeight: 42, paddingHorizontal: 18 },
    resultCount: { color: colors.textMuted, fontSize: 13, fontWeight: '500' },
    resultRow: { alignItems: 'center', flexDirection: 'row', minHeight: 78, paddingHorizontal: 14 },
    resultIcon: { alignItems: 'center', backgroundColor: colors.surface, borderRadius: 22, height: 44, justifyContent: 'center', width: 44 },
    thumbnail: { backgroundColor: colors.surface, borderRadius: 6, height: 48, width: 48 },
    resultText: { borderBottomColor: colors.divider, borderBottomWidth: StyleSheet.hairlineWidth, flex: 1, marginLeft: 12, minHeight: 78, paddingRight: 10, paddingVertical: 11 },
    resultTitleRow: { alignItems: 'center', flexDirection: 'row' },
    resultTitle: { color: colors.text, flex: 1, fontSize: 16, fontWeight: '600', lineHeight: 21 },
    resultTime: { color: colors.textMuted, fontSize: 12, marginLeft: 8 },
    resultMeta: { color: colors.textMuted, fontSize: 12, marginTop: 3 },
    resultBody: { color: colors.text, fontSize: 14, lineHeight: 19, marginTop: 4 },
    domain: { color: colors.primary, fontSize: 12, fontWeight: '600', marginTop: 3 },
    emptyList: { flexGrow: 1 },
    emptyContainer: { alignItems: 'center', flex: 1, justifyContent: 'center', paddingHorizontal: 30 },
    emptyTitle: { color: colors.text, fontSize: 17, fontWeight: '500', marginTop: 12, textAlign: 'center' },
    emptySubtitle: { color: colors.textMuted, fontSize: 14, lineHeight: 20, marginTop: 6, textAlign: 'center' },
  });
