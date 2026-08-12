import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import type { ChatMessage, FileAttachment, LocationAttachment } from '../types/message';
import { getFileCategory } from '../utils/file';

export type PendingAttachment =
  | {
      id: string;
      kind: 'image' | 'video';
      uri: string;
      fileName: string;
      width?: number;
      height?: number;
      durationMs?: number | null;
    }
  | {
      id: string;
      kind: 'file' | 'audio';
      file: FileAttachment;
    }
  | {
      id: string;
      kind: 'location';
      location: LocationAttachment;
    };

export const documentPickerTypes = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/zip',
  'text/plain',
];

export async function requestCameraAttachment(): Promise<PendingAttachment[]> {
  const permission = await ImagePicker.requestCameraPermissionsAsync();

  if (!permission.granted) {
    throw new Error('Please allow camera access to take and send media.');
  }

  const result = await ImagePicker.launchCameraAsync({
    mediaTypes: ['images', 'videos'],
    quality: 0.82,
    videoMaxDuration: 120,
  });

  if (result.canceled) {
    return [];
  }

  return result.assets.map(mapPickedMedia);
}

export async function requestGalleryAttachments(): Promise<PendingAttachment[]> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

  if (!permission.granted) {
    throw new Error('Please allow photo library access to send photos and videos.');
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    allowsMultipleSelection: true,
    mediaTypes: ['images', 'videos'],
    quality: 0.82,
    selectionLimit: 8,
  });

  if (result.canceled) {
    return [];
  }

  return result.assets.map(mapPickedMedia);
}

export async function requestDocumentAttachments(): Promise<PendingAttachment[]> {
  const result = await DocumentPicker.getDocumentAsync({
    copyToCacheDirectory: true,
    multiple: true,
    type: documentPickerTypes,
  });

  if (result.canceled) {
    return [];
  }

  return Promise.all(
    result.assets.map(async (asset) => ({
      id: `pending-file-${Date.now()}-${asset.name}`,
      kind: 'file' as const,
      file: await buildFileAttachment(asset.uri, asset.name, asset.size, asset.mimeType),
    })),
  );
}

export async function requestAudioAttachments(): Promise<PendingAttachment[]> {
  const result = await DocumentPicker.getDocumentAsync({
    copyToCacheDirectory: true,
    multiple: true,
    type: ['audio/*'],
  });

  if (result.canceled) {
    return [];
  }

  return Promise.all(
    result.assets.map(async (asset) => ({
      id: `pending-audio-${Date.now()}-${asset.name}`,
      kind: 'audio' as const,
      file: await buildFileAttachment(asset.uri, asset.name, asset.size, asset.mimeType ?? 'audio/mpeg'),
    })),
  );
}

export function createLocationAttachment(): PendingAttachment {
  return {
    id: `pending-location-${Date.now()}`,
    kind: 'location',
    location: {
      title: 'Current location',
      address: 'Location sharing preview',
      latitude: 12.9716,
      longitude: 77.5946,
    },
  };
}

export function buildOutgoingMessage(
  attachment: PendingAttachment,
  timestamp: number,
  index: number,
  replyTo?: ChatMessage['replyTo'],
): ChatMessage {
  const base = {
    id: `local-attachment-${timestamp}-${index}`,
    sender: 'me' as const,
    timestamp: new Date(timestamp + index).toISOString(),
    status: 'sending' as const,
    replyTo,
    transferStatus: 'uploading' as const,
    transferProgress: 0,
  };

  switch (attachment.kind) {
    case 'image':
    case 'video':
      return {
        ...base,
        kind: attachment.kind,
        mediaUri: attachment.uri,
        image: attachment.kind === 'image' ? { uri: attachment.uri } : undefined,
        fileName: attachment.fileName,
        mediaSize:
          attachment.width && attachment.height
            ? {
                width: attachment.width,
                height: attachment.height,
              }
            : undefined,
        durationMs: attachment.durationMs,
      };
    case 'file':
    case 'audio':
      return {
        ...base,
        kind: attachment.kind,
        file: attachment.file,
        fileName: attachment.file.name,
      };
    case 'location':
      return {
        ...base,
        kind: 'location',
        location: attachment.location,
        transferStatus: 'complete',
        transferProgress: 1,
      };
  }
}

export function getAttachmentLabel(attachment: PendingAttachment): string {
  switch (attachment.kind) {
    case 'image':
      return attachment.fileName || 'Photo';
    case 'video':
      return attachment.fileName || 'Video';
    case 'file':
    case 'audio':
      return attachment.file.name;
    case 'location':
      return attachment.location.title;
  }
}

function mapPickedMedia(asset: ImagePicker.ImagePickerAsset): PendingAttachment {
  const isVideo = asset.type === 'video' || asset.mimeType?.startsWith('video/') === true;

  return {
    id: `pending-media-${Date.now()}-${asset.assetId ?? asset.uri}`,
    kind: isVideo ? 'video' : 'image',
    uri: asset.uri,
    fileName: asset.fileName ?? (isVideo ? 'Video' : 'Photo'),
    width: asset.width,
    height: asset.height,
    durationMs: asset.duration ?? null,
  };
}

async function buildFileAttachment(
  uri: string,
  name: string,
  providedSize?: number,
  mimeType?: string,
): Promise<FileAttachment> {
  let size = providedSize;

  if (!size) {
    const info = await FileSystem.getInfoAsync(uri);
    size = info.exists ? info.size : undefined;
  }

  return {
    uri,
    name,
    size,
    mimeType,
    category: getFileCategory(name, mimeType),
  };
}
