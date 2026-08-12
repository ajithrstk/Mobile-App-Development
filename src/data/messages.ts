import type { ChatMessage, MessageDeliveryStatus, MessageKind, MessageSender } from '../types/message';
import { getMessagePreview } from '../utils/chat';

const messageImages = [
  require('../../assets/avatars/travel-plan.png'),
  require('../../assets/avatars/design-team.png'),
  require('../../assets/avatars/office-lunch.png'),
  require('../../assets/avatars/fitness-group.png'),
];

const sentTexts = [
  'Morning! Did you get a chance to check the build?',
  'I pushed the latest changes and left notes in the task.',
  'The UI looks closer now. I am testing smaller screens too.',
  'Can we keep the call short today?',
  'I will send the screenshots in a bit.',
  'That works for me.',
  'Let us use the second option. It feels cleaner.',
  'I fixed the spacing issue on the message row.',
  'Please remind me after lunch.',
  'Nice, that is exactly what I needed.',
];

const receivedTexts = [
  'Yes, I checked it just now.',
  'Looks good. One tiny alignment issue near the header.',
  'No rush, send it whenever you are done.',
  'Perfect. I will review from my side.',
  'Can you add the voice message state as well?',
  'The last version felt much smoother.',
  'Let us keep the WhatsApp feel but make it reusable.',
  'I am online for the next hour.',
  "Yesterday's notes are still valid.",
  'Great, ship it when the typecheck passes.',
];

const voiceDurations = ['0:12', '0:28', '0:43', '1:05', '1:18', '2:04'];

function buildTimestamp(date: string, minutesFromMidnight: number): string {
  const hours = Math.floor(minutesFromMidnight / 60);
  const minutes = minutesFromMidnight % 60;

  return `${date}T${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00+05:30`;
}

function getDateForIndex(index: number): string {
  if (index < 14) {
    return '2026-07-28';
  }

  if (index < 34) {
    return '2026-07-29';
  }

  return '2026-07-30';
}

function getKindForIndex(index: number): MessageKind {
  if (index % 13 === 5) {
    return 'image';
  }

  if (index % 9 === 3) {
    return 'voice';
  }

  return 'text';
}

function getStatusForIndex(index: number): MessageDeliveryStatus {
  if (index % 5 === 0) {
    return 'sent';
  }

  if (index % 3 === 0) {
    return 'delivered';
  }

  return 'read';
}

const generatedMessages: ChatMessage[] = Array.from({ length: 60 }, (_, index) => {
  const sender: MessageSender = index % 4 === 0 || index % 4 === 1 ? 'them' : 'me';
  const kind = getKindForIndex(index);
  const dayStart = index < 14 ? 8 * 60 + 15 : index < 34 ? 9 * 60 + 5 : 8 * 60 + 35;
  const timestamp = buildTimestamp(getDateForIndex(index), dayStart + (index % 20) * 17);
  const baseMessage: ChatMessage = {
    id: `msg-${index + 1}`,
    sender,
    kind,
    timestamp,
    starred: index === 12 || index === 39 || index === 54,
    status: sender === 'me' ? getStatusForIndex(index) : undefined,
  };

  if (kind === 'image') {
    return {
      ...baseMessage,
      image: messageImages[index % messageImages.length],
      text: sender === 'me' ? 'Here is the reference image.' : 'Sharing the image from my side.',
    };
  }

  if (kind === 'voice') {
    return {
      ...baseMessage,
      duration: voiceDurations[index % voiceDurations.length],
    };
  }

  return {
    ...baseMessage,
    text: sender === 'me' ? sentTexts[index % sentTexts.length] : receivedTexts[index % receivedTexts.length],
  };
});

const messages: ChatMessage[] = generatedMessages.map((message, index) => {
  if (index === 7) {
    return {
      ...message,
      kind: 'video',
      text: undefined,
      fileName: 'design-review.mp4',
      durationMs: 39000,
      transferStatus: 'idle',
      transferProgress: 0,
    };
  }

  if (index === 14) {
    return {
      ...message,
      kind: 'file',
      text: undefined,
      fileName: 'Project brief.pdf',
      file: {
        name: 'Project brief.pdf',
        size: 1843200,
        mimeType: 'application/pdf',
        category: 'pdf',
      },
      transferStatus: 'complete',
      transferProgress: 1,
      reactions: [
        { emoji: '\uD83D\uDC4D', count: 2, reactedByMe: true },
        { emoji: '\uD83D\uDE80', count: 1 },
      ],
    };
  }

  if (index === 22) {
    return {
      ...message,
      kind: 'file',
      text: undefined,
      fileName: 'Sprint costs.xlsx',
      file: {
        name: 'Sprint costs.xlsx',
        size: 652240,
        mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        category: 'sheet',
      },
      transferStatus: 'failed',
      transferProgress: 0.36,
      status: 'failed',
    };
  }

  if (index === 28) {
    return {
      ...message,
      kind: 'audio',
      text: undefined,
      fileName: 'standup-note.m4a',
      file: {
        name: 'standup-note.m4a',
        size: 421100,
        mimeType: 'audio/mp4',
        category: 'audio',
      },
      transferStatus: 'complete',
      transferProgress: 1,
    };
  }

  if (index === 35) {
    return {
      ...message,
      kind: 'location',
      text: undefined,
      location: {
        title: 'Cafe meeting point',
        address: 'MG Road, Bengaluru',
        latitude: 12.9758,
        longitude: 77.6068,
      },
      transferStatus: 'complete',
      transferProgress: 1,
      forwarded: true,
    };
  }

  if (![18, 31, 46, 57].includes(index)) {
    return index === 9
      ? {
          ...message,
          reactions: [
            { emoji: '\u2764\uFE0F', count: 3 },
            { emoji: '\uD83D\uDE02', count: 1, reactedByMe: true },
          ],
        }
      : message;
  }

  const repliedMessage = generatedMessages[index - 1];

  return {
    ...message,
    replyTo: {
      id: repliedMessage.id,
      sender: repliedMessage.sender,
      text: getMessagePreview(repliedMessage),
    },
  };
});

export default messages;
