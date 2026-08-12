# Component Library Notes

The app already has WhatsApp-style components under `src/components`.

Reusable UI primitives added for capstone work live under `src/components/ui` and should stay small:

- `StatusPill`: compact status label for security, sync, and production state surfaces.

Prefer extending existing components such as `MessageBubble`, `MediaMessage`, `ChatHeader`, `MessageInput`, and `NetworkStatusBanner` before adding new visual systems.
