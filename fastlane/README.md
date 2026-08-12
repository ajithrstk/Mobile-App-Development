# Fastlane Structure

This Expo project is ready for a future Fastlane handoff, but native signing secrets are not stored in the repository.

Recommended lanes after native credentials are configured:

- `android beta`: build an Android release candidate and upload to internal testing.
- `android production`: promote a signed Android build to production.
- `ios beta`: build an iOS release candidate and upload to TestFlight.
- `ios production`: submit the approved iOS build for App Store review.

Use EAS credentials or CI secrets for keystores, certificates, provisioning profiles, API keys, feature flag tokens, and monitoring DSNs.
