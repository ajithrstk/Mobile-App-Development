# Chatterly Production Capstone Architecture

This project keeps the existing WhatsApp-style UI and mock API, then adds replaceable production facades around it.

## Frontend facades

- Offline queue: `src/services/network/networkManager.ts` keeps in-memory operations and persists queue metadata in `src/database/localDatabase.ts`.
- Message sync: `src/services/syncService.ts` syncs pending messages, chats, contacts, notification side effects, and expired media cleanup on startup, reconnect, foreground, and scheduled worker ticks.
- Encryption: `src/encryption/encryptionService.ts` creates local identity/session metadata and mock envelopes. This is not real E2E encryption and must be replaced with a backend key exchange and audited crypto before production.
- Media: `src/services/media/downloadManager.ts` tracks progressive downloads, streaming states, expiration, and cleanup. Existing attachment upload flows remain intact.
- Notifications: `src/notifications/services/notificationService.ts` supports channel metadata, grouped message notifications, scheduled notifications, silent/muted notifications, badge state, and duplicate suppression.
- Observability: `src/observability/analyticsService.ts` records API metrics, screen-load traces, network recovery, interactions, and error events through the centralized logger.
- Security: `src/security/securityService.ts` provides SSL-pinning policy checks and replaceable root, emulator, tamper, screenshot, and clipboard protection signals.
- Production config: `src/config/runtimeConfig.ts` owns feature flags, environment, remote config shape, A/B tests, force update, maintenance mode, and version compatibility.

## Backend dependencies still needed

- Real auth/session backend.
- Real Socket.IO gateway with delivery receipts, presence, typing, heartbeat, and failover.
- Real E2E key exchange, signed prekeys, device verification, key rotation, and secure native key storage.
- Push notification provider with FCM/APNs direct reply, grouping, channels, mark-as-read actions, and muted delivery.
- Media backend for upload signing, server-side thumbnails/transcoding, streaming, retention, and encrypted blob storage.
- Remote config and feature flag service, Firebase or equivalent observability, crash reporting, and analytics.

## Mock features

- Mock API adapter and mock socket service.
- Mock encryption envelopes.
- Mock local database over existing JSON storage instead of SQLite/MMKV/AsyncStorage.
- Mock notification delivery events instead of OS push delivery.
- Mock media transfer progress instead of real network transfers.

## Replacement rule

Each mock is isolated behind a service interface. Replace service internals first; avoid changing screen code unless the backend contract itself changes.
