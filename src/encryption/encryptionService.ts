import { Platform } from 'react-native';
import { localDatabase } from '../database/localDatabase';
import { storageService } from '../storage/storageService';
import type { ChatMessage } from '../types/message';
import { logger } from '../services/logging/logger';

export type EncryptionTrustState = 'mock-secure' | 'verified' | 'unverified' | 'rotating';

export type LocalIdentityKeyPair = {
  publicKey: string;
  privateKeyRef: string;
  deviceId: string;
  createdAt: string;
  rotation: number;
};

export type MessageEncryptionEnvelope = {
  algorithm: 'mock-local-envelope-v1';
  ciphertext: string;
  deviceId: string;
  keyId: string;
  sessionId: string;
  trustState: EncryptionTrustState;
};

const identityStorageKey = 'chatterly.encryption.identity';
const sessionStorageKey = 'chatterly.encryption.sessions';

function randomId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
}

function encodeMockPayload(value: string): string {
  return Array.from(value)
    .map((character) => character.charCodeAt(0).toString(16).padStart(4, '0'))
    .join('');
}

function decodeMockPayload(value: string): string {
  const chunks = value.match(/.{1,4}/g) ?? [];
  return chunks.map((chunk) => String.fromCharCode(Number.parseInt(chunk, 16))).join('');
}

class EncryptionService {
  private identity: LocalIdentityKeyPair | null = null;

  async initialize(): Promise<void> {
    this.identity = await storageService.get<LocalIdentityKeyPair | null>(identityStorageKey, null);

    if (!this.identity) {
      this.identity = {
        createdAt: new Date().toISOString(),
        deviceId: randomId(`${Platform.OS}-device`),
        privateKeyRef: randomId('secure-store-private-key-ref'),
        publicKey: randomId('mock-public-key'),
        rotation: 1,
      };
      await storageService.set(identityStorageKey, this.identity);
    }

    logger.info('Encryption architecture initialized', {
      deviceId: this.identity.deviceId,
      mode: 'mock-envelope',
      rotation: this.identity.rotation,
    });
  }

  getIdentity(): LocalIdentityKeyPair | null {
    return this.identity;
  }

  async ensureSession(chatId: string): Promise<string> {
    await this.initialize();
    const sessions = await storageService.get<Record<string, string>>(sessionStorageKey, {});
    const existingSession = sessions[chatId];

    if (existingSession) {
      return existingSession;
    }

    const sessionId = randomId(`mock-session-${chatId}`);
    await storageService.set(sessionStorageKey, { ...sessions, [chatId]: sessionId });
    return sessionId;
  }

  async encryptMessage(message: ChatMessage): Promise<MessageEncryptionEnvelope | undefined> {
    if (!message.chatId || message.sender !== 'me') {
      return undefined;
    }

    const identity = this.identity ?? await this.loadIdentity();
    const sessionId = await this.ensureSession(message.chatId);
    const plaintext = JSON.stringify({
      fileName: message.fileName,
      kind: message.kind,
      mediaUri: message.mediaUri,
      text: message.text,
    });

    return {
      algorithm: 'mock-local-envelope-v1',
      ciphertext: encodeMockPayload(plaintext),
      deviceId: identity.deviceId,
      keyId: `${identity.publicKey}:r${identity.rotation}`,
      sessionId,
      trustState: 'mock-secure',
    };
  }

  async decryptEnvelope(envelope: MessageEncryptionEnvelope): Promise<string> {
    return decodeMockPayload(envelope.ciphertext);
  }

  async rotateKeys(reason: string): Promise<LocalIdentityKeyPair> {
    const current = this.identity ?? await this.loadIdentity();
    const nextIdentity = {
      ...current,
      privateKeyRef: randomId('secure-store-private-key-ref'),
      publicKey: randomId('mock-public-key'),
      rotation: current.rotation + 1,
    };

    this.identity = nextIdentity;
    await storageService.set(identityStorageKey, nextIdentity);
    await localDatabase.upsert('securityEvents', {
      id: randomId('key-rotation'),
      reason,
      rotation: nextIdentity.rotation,
      type: 'key-rotation',
    });
    logger.info('Mock encryption keys rotated', { reason, rotation: nextIdentity.rotation });
    return nextIdentity;
  }

  async markDeviceVerified(deviceId: string): Promise<void> {
    await localDatabase.upsert('securityEvents', {
      deviceId,
      id: `device-verified-${deviceId}`,
      type: 'device-verification',
      verified: true,
    });
  }

  getIndicatorText(): string {
    return 'Messages use a mock encryption envelope in this demo. Replace encryptionService with real E2E key exchange before production.';
  }

  private async loadIdentity(): Promise<LocalIdentityKeyPair> {
    await this.initialize();

    if (!this.identity) {
      throw new Error('Encryption identity is unavailable.');
    }

    return this.identity;
  }
}

export const encryptionService = new EncryptionService();
