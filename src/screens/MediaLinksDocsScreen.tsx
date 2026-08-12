import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useMemo, useState } from 'react';
import { Alert, FlatList, Image, Linking, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import SearchBar from '../components/SearchBar';
import type { RootStackParamList } from '../types';
import type { ChatMessage } from '../types/message';
import type { ThemeColors } from '../utils/colors';
import { useThemeColors } from '../utils/colors';
import { formatBytes } from '../utils/file';
import { formatMessageTime, getMessagePreview } from '../utils/chat';

type MediaLinksDocsScreenProps = NativeStackScreenProps<RootStackParamList, 'MediaLinksDocsScreen'>;
type TabKey = 'media' | 'docs' | 'links';

const URL_PATTERN = /(https?:\/\/[^\s]+)/i;

function getUrl(message: ChatMessage): string | undefined {
  return message.linkPreview?.url ?? message.text?.match(URL_PATTERN)?.[1];
}

function getDomain(url?: string): string {
  if (!url) {
    return 'website';
  }

  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url.replace(/^https?:\/\//, '').split('/')[0];
  }
}

export default function MediaLinksDocsScreen({ navigation, route }: MediaLinksDocsScreenProps) {
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { chat, messages } = route.params;
  const [activeTab, setActiveTab] = useState<TabKey>('media');
  const [linkQuery, setLinkQuery] = useState('');

  const mediaMessages = useMemo(
    () => messages.filter((message) => !message.deleted && (message.kind === 'image' || message.kind === 'video' || message.kind === 'gif')),
    [messages],
  );
  const docMessages = useMemo(
    () => messages.filter((message) => !message.deleted && (message.kind === 'file' || message.kind === 'audio')),
    [messages],
  );
  const linkMessages = useMemo(() => {
    const normalizedQuery = linkQuery.trim().toLowerCase();
    return messages.filter((message) => {
      if (message.deleted || (!message.linkPreview && !URL_PATTERN.test(message.text ?? ''))) {
        return false;
      }

      if (!normalizedQuery) {
        return true;
      }

      return [
        message.text,
        message.linkPreview?.title,
        message.linkPreview?.description,
        message.linkPreview?.domain,
        message.linkPreview?.url,
      ].filter(Boolean).join(' ').toLowerCase().includes(normalizedQuery);
    });
  }, [linkQuery, messages]);

  const simulateAction = (label: string) => {
    Alert.alert(label, `${label} simulated locally.`);
  };

  const forwardMessage = (message: ChatMessage) => {
    navigation.navigate('ForwardSelectionScreen', { sourceChat: chat, messages: [message] });
  };

  const renderMedia = ({ item }: { item: ChatMessage }) => (
    <TouchableOpacity activeOpacity={0.82} onPress={() => navigation.navigate('MediaViewerScreen', { chat, message: item })} style={styles.mediaTile}>
      {item.image ? (
        <Image source={item.image} style={styles.mediaImage} />
      ) : (
        <View style={styles.mediaPlaceholder}>
          <Ionicons name="play" size={28} color={colors.badgeText} />
        </View>
      )}
      <View style={styles.mediaOverlay}>
        <Ionicons name={item.kind === 'video' ? 'videocam' : item.kind === 'gif' ? 'sparkles-outline' : 'image'} size={14} color={colors.badgeText} />
        <Text style={styles.mediaLabel}>{item.kind === 'gif' ? 'GIF' : item.kind === 'video' ? 'Video' : formatMessageTime(item.timestamp)}</Text>
      </View>
    </TouchableOpacity>
  );

  const renderDocument = ({ item }: { item: ChatMessage }) => (
    <View style={styles.listRow}>
      <View style={styles.documentIcon}>
        <MaterialCommunityIcons name={item.kind === 'audio' ? 'file-music-outline' : 'file-document-outline'} size={28} color={colors.badgeText} />
      </View>
      <View style={styles.listText}>
        <Text numberOfLines={1} style={styles.rowTitle}>{item.file?.name ?? item.fileName ?? 'Document'}</Text>
        <Text numberOfLines={1} style={styles.rowSubtitle}>
          {formatBytes(item.file?.size)} - {formatMessageTime(item.timestamp)}
        </Text>
      </View>
      <TouchableOpacity onPress={() => simulateAction('Download')} style={styles.rowIconButton}>
        <Ionicons name="download-outline" size={21} color={colors.primary} />
      </TouchableOpacity>
      <TouchableOpacity onPress={() => simulateAction('Share')} style={styles.rowIconButton}>
        <Ionicons name="share-social-outline" size={20} color={colors.primary} />
      </TouchableOpacity>
      <TouchableOpacity onPress={() => forwardMessage(item)} style={styles.rowIconButton}>
        <Ionicons name="arrow-redo-outline" size={21} color={colors.primary} />
      </TouchableOpacity>
    </View>
  );

  const renderLink = ({ item }: { item: ChatMessage }) => {
    const url = getUrl(item);
    const domain = item.linkPreview?.domain ?? getDomain(url);

    return (
      <View style={styles.linkRow}>
        <TouchableOpacity activeOpacity={0.76} onPress={() => url && Linking.openURL(url)} style={styles.linkPreview}>
          <View style={styles.linkThumb}>
            <Ionicons name="link-outline" size={26} color={colors.primary} />
          </View>
          <View style={styles.listText}>
            <Text numberOfLines={1} style={styles.rowTitle}>{item.linkPreview?.title ?? domain}</Text>
            <Text numberOfLines={2} style={styles.rowSubtitle}>{item.linkPreview?.description ?? getMessagePreview(item)}</Text>
            <Text numberOfLines={1} style={styles.linkUrl}>{url}</Text>
            <Text style={styles.rowSubtitle}>Related message - {formatMessageTime(item.timestamp)}</Text>
          </View>
        </TouchableOpacity>
        <View style={styles.linkActions}>
          <TouchableOpacity onPress={() => simulateAction('Share')} style={styles.rowIconButton}>
            <Ionicons name="share-social-outline" size={20} color={colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => forwardMessage(item)} style={styles.rowIconButton}>
            <Ionicons name="arrow-redo-outline" size={21} color={colors.primary} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const data = activeTab === 'media' ? mediaMessages : activeTab === 'docs' ? docMessages : linkMessages;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconButton}>
          <Ionicons name="arrow-back" size={24} color={colors.icon} />
        </TouchableOpacity>
        <Text style={styles.title}>Media, links and docs</Text>
      </View>
      <View style={styles.tabs}>
        {(['media', 'docs', 'links'] as TabKey[]).map((tab) => (
          <TouchableOpacity activeOpacity={0.74} key={tab} onPress={() => setActiveTab(tab)} style={[styles.tab, activeTab === tab && styles.activeTab]}>
            <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
              {tab === 'media' ? 'Media' : tab === 'docs' ? 'Docs' : 'Links'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      {activeTab === 'links' && (
        <SearchBar colors={colors} onChangeText={setLinkQuery} placeholder="Search links" value={linkQuery} />
      )}
      <FlatList
        contentContainerStyle={data.length === 0 ? styles.emptyList : styles.listContent}
        data={data}
        initialNumToRender={18}
        key={activeTab}
        keyExtractor={(item) => item.id}
        maxToRenderPerBatch={12}
        numColumns={activeTab === 'media' ? 3 : 1}
        renderItem={activeTab === 'media' ? renderMedia : activeTab === 'docs' ? renderDocument : renderLink}
        windowSize={9}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name={activeTab === 'media' ? 'images-outline' : activeTab === 'docs' ? 'document-text-outline' : 'link-outline'} size={38} color={colors.textMuted} />
            <Text style={styles.emptyTitle}>No {activeTab === 'docs' ? 'documents' : activeTab} found</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    safeArea: { backgroundColor: colors.background, flex: 1 },
    header: { alignItems: 'center', borderBottomColor: colors.divider, borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: 'row', minHeight: 62, paddingHorizontal: 8 },
    iconButton: { alignItems: 'center', height: 44, justifyContent: 'center', width: 42 },
    title: { color: colors.text, fontSize: 18, fontWeight: '400' },
    tabs: { borderBottomColor: colors.divider, borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: 'row' },
    tab: { alignItems: 'center', flex: 1, minHeight: 46, justifyContent: 'center' },
    activeTab: { borderBottomColor: colors.primary, borderBottomWidth: 2 },
    tabText: { color: colors.textMuted, fontSize: 14, fontWeight: '600' },
    activeTabText: { color: colors.primary },
    listContent: { paddingBottom: 18 },
    mediaTile: { aspectRatio: 1, backgroundColor: colors.surface, borderColor: colors.background, borderWidth: 1, flex: 1 / 3, overflow: 'hidden' },
    mediaImage: { height: '100%', width: '100%' },
    mediaPlaceholder: { alignItems: 'center', backgroundColor: colors.primaryDark, flex: 1, justifyContent: 'center' },
    mediaOverlay: { alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.42)', bottom: 0, flexDirection: 'row', left: 0, minHeight: 24, paddingHorizontal: 6, position: 'absolute', right: 0 },
    mediaLabel: { color: colors.badgeText, fontSize: 11, fontWeight: '600', marginLeft: 4 },
    listRow: { alignItems: 'center', flexDirection: 'row', minHeight: 78, paddingHorizontal: 16 },
    documentIcon: { alignItems: 'center', backgroundColor: colors.primary, borderRadius: 8, height: 46, justifyContent: 'center', width: 46 },
    listText: { flex: 1, marginLeft: 12, minWidth: 0 },
    rowTitle: { color: colors.text, fontSize: 15, fontWeight: '600' },
    rowSubtitle: { color: colors.textMuted, fontSize: 12, lineHeight: 17, marginTop: 3 },
    rowIconButton: { alignItems: 'center', height: 40, justifyContent: 'center', width: 36 },
    linkRow: { borderBottomColor: colors.divider, borderBottomWidth: StyleSheet.hairlineWidth, paddingHorizontal: 16, paddingVertical: 12 },
    linkPreview: { flexDirection: 'row' },
    linkThumb: { alignItems: 'center', backgroundColor: colors.surface, borderRadius: 7, height: 58, justifyContent: 'center', width: 58 },
    linkUrl: { color: colors.primary, fontSize: 12, fontWeight: '600', marginTop: 4 },
    linkActions: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 6 },
    emptyList: { flexGrow: 1 },
    emptyContainer: { alignItems: 'center', flex: 1, justifyContent: 'center' },
    emptyTitle: { color: colors.textMuted, fontSize: 16, fontWeight: '500', marginTop: 10 },
  });
