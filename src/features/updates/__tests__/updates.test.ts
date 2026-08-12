export type UpdatesTestCase = {
  id: string;
  title: string;
  steps: string[];
  expected: string;
};

export const updatesTestCases: UpdatesTestCase[] = [
  {
    expected: 'Status previews remain visible above followed, discover, and muted channel sections.',
    id: 'updates-home-sections',
    steps: ['Open the Updates tab', 'Pull to refresh', 'Scroll to the Discover section'],
    title: 'Updates home combines Status and Channels',
  },
  {
    expected: 'Follow state updates optimistically, persists to local storage, and socket listeners do not duplicate rows.',
    id: 'channel-follow-realtime',
    steps: ['Tap Follow on an unfollowed channel', 'Leave and reopen Updates', 'Emit channel:followed for the same channel'],
    title: 'Channel follow and realtime reconciliation',
  },
  {
    expected: 'Admin can edit channel metadata, permissions, admin IDs, and publish text/image/video/link updates.',
    id: 'channel-admin-publish',
    steps: ['Create a channel', 'Open Channel tools', 'Publish each update kind', 'Reopen the channel feed'],
    title: 'Channel admin lifecycle',
  },
  {
    expected: 'Search is debounced, recent searches are stored, and empty results render without repeated API calls.',
    id: 'channel-search',
    steps: ['Open Channel search', 'Type a username fragment', 'Open a result', 'Return and clear recent searches'],
    title: 'Channel search and recent search cache',
  },
  {
    expected: 'Broadcast sends one existing chat message per recipient through messagesActions with normal delivery states.',
    id: 'broadcast-send',
    steps: ['Create a broadcast list', 'Select multiple recipients', 'Type a message', 'Tap Send'],
    title: 'Broadcast message fanout',
  },
  {
    expected: 'Cached channels, channel updates, broadcasts, and recent searches remain available when channel APIs are unavailable.',
    id: 'offline-cache',
    steps: ['Load Updates once', 'Simulate unavailable backend', 'Restart the screen', 'Create and publish through the mock adapter'],
    title: 'Offline-ready local mock adapter',
  },
];
