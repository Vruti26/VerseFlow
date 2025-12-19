import { Timestamp } from 'firebase/firestore';
import { Book } from './types';

export const books: Book[] = [
  {
    id: '1',
    title: 'The Crimson Cipher',
    author: 'Alex Drake',
    authorId: '1',
    description: 'In a world where words hold power, a young scribe discovers a forbidden book that could unravel the fabric of reality. Hunted by a shadowy organization, she must decode its secrets before it\'s too late.',
    coverImage: 'book-cover-1',
    status: 'published',
    tags: ['#fantasy', '#magic', '#adventure'],
    createdAt: Timestamp.fromDate(new Date('2023-10-26T10:00:00Z')),
    updatedAt: Timestamp.fromDate(new Date('2023-11-15T14:30:00Z')),
  },
  {
    id: '2',
    title: 'Echoes of Andromeda',
    author: 'J.C. Mars',
    authorId: '2',
    description: 'A lone astronaut on a deep space mission awakens to find his ship adrift and his crew missing. His only companion is the ship\'s cryptic AI, which seems to know more than it lets on.',
    coverImage: 'book-cover-3',
    status: 'published',
    tags: ['#scifi', '#mystery', '#thriller'],
    createdAt: Timestamp.fromDate(new Date('2023-09-10T18:45:00Z')),
    updatedAt: Timestamp.fromDate(new Date('2023-11-20T11:20:00Z')),
  },
  {
    id: '3',
    title: 'The Last Love Letter',
    author: 'Emily Page',
    authorId: '3',
    description: 'A young woman finds a collection of unsent love letters in a vintage desk and embarks on a journey to find the intended recipient, discovering a love story that transcends time.',
    coverImage: 'book-cover-6',
    status: 'published',
    tags: ['#romance', '#historical', '#feelgood'],
    createdAt: Timestamp.fromDate(new Date('2023-08-05T09:20:00Z')),
    updatedAt: Timestamp.fromDate(new Date('2023-10-12T16:00:00Z')),
  },
  {
    id: '4',
    title: 'Shadow of the Spire',
    author: 'Kenji Tanaka',
    authorId: '4',
    description: 'In a city ruled by guilds, a young thief is framed for a crime she didn\'t commit. To clear her name, she must ascend the treacherous Spire, a dungeon of monsters and political intrigue.',
    coverImage: 'book-cover-2',
    status: 'published',
    tags: ['#fantasy', '#dungeon', '#action'],
    createdAt: Timestamp.fromDate(new Date('2023-11-01T12:00:00Z')),
    updatedAt: Timestamp.fromDate(new Date('2023-11-01T12:00:00Z')),
  },
  {
    id: '5',
    title: 'The Poet\'s Demise',
    author: 'Eleanor Vance',
    authorId: '5',
    description: 'A detective investigates the mysterious death of a renowned poet, diving into a world of literary rivalries, secret societies, and hidden verses that point to murder.',
    coverImage: 'book-cover-4',
    status: 'draft',
    tags: ['#mystery', '#crime', '#literary'],
    createdAt: Timestamp.fromDate(new Date('2023-11-18T17:00:00Z')),
    updatedAt: Timestamp.fromDate(new Date('2023-11-22T09:00:00Z')),
  },
  {
    id: '6',
    title: 'Forest of Whispers',
    author: 'Liam O\'Connell',
    authorId: '6',
    description: 'When children start disappearing near the ancient woods, a local folklorist suspects a creature from old tales is to blame. He must convince the skeptical townsfolk before another child is taken.',
    coverImage: 'book-cover-5',
    status: 'published',
    tags: ['#horror', '#folklore', '#supernatural'],
    createdAt: Timestamp.fromDate(new Date('2023-07-20T21:00:00Z')),
    updatedAt: Timestamp.fromDate(new Date('2023-09-30T13:15:00Z')),
  },
];

export const users = [
  { id: '1', name: 'Alex Drake', email: 'alex.drake@example.com', booksWritten: 1, avatarId: 'user-avatar-1' },
  { id: '2', name: 'J.C. Mars', email: 'jc.mars@example.com', booksWritten: 1, avatarId: 'user-avatar-2' },
  { id: '3', name: 'Emily Page', email: 'emily.page@example.com', booksWritten: 1, avatarId: 'user-avatar-3' },
  { id: '4', name: 'Kenji Tanaka', email: 'kenji.tanaka@example.com', booksWritten: 1, avatarId: 'user-avatar-1' },
  { id: '5', name: 'Eleanor Vance', email: 'eleanor.vance@example.com', booksWritten: 1, avatarId: 'user-avatar-2' },
  { id: '6', name: 'Liam O\'Connell', email: 'liam.oconnell@example.com', booksWritten: 1, avatarId: 'user-avatar-3' },
];

export const reports = [
  { id: '1', bookId: '2', bookTitle: 'Echoes of Andromeda', reportedBy: 'Emily Page', reason: 'Inappropriate content in chapter 3.', status: 'Pending' },
  { id: '2', userId: '5', userName: 'Eleanor Vance', reportedBy: 'Admin', reason: 'Spamming comments.', status: 'Resolved' },
  { id: '3', bookId: '1', bookTitle: 'The Crimson Cipher', reportedBy: 'Kenji Tanaka', reason: 'Plagiarism concern.', status: 'Pending' },
];

export const hashtags = [
  { tag: '#fantasy', rank: 1, count: 12053 },
  { tag: '#romance', rank: 2, count: 10890 },
  { tag: '#scifi', rank: 3, count: 9754 },
  { tag: '#mystery', rank: 4, count: 8643 },
  { tag: '#action', rank: 5, count: 7532 },
  { tag: '#horror', rank: 6, count: 6421 },
];

export const messages = [
  {
    id: '1',
    contactName: 'Emily Page',
    contactAvatarId: 'user-avatar-3',
    lastMessage: 'Hey! I just finished reading your first chapter, it\'s amazing!',
    timestamp: '2 hours ago',
    unreadCount: 1,
    conversation: [
      { sender: 'other', text: 'Hey! I just finished reading your first chapter, it\'s amazing!', time: '10:30 AM' },
      { sender: 'me', text: 'Thank you so much! That means a lot.', time: '10:32 AM' },
    ],
  },
  {
    id: '2',
    contactName: 'J.C. Mars',
    contactAvatarId: 'user-avatar-2',
    lastMessage: 'Sure, I can take a look this weekend.',
    timestamp: 'Yesterday',
    unreadCount: 0,
    conversation: [
        { sender: 'me', text: 'Hey, would you be open to a read-for-read?', time: 'Yesterday 8:15 PM' },
        { sender: 'other', text: 'Sure, I can take a look this weekend.', time: 'Yesterday 8:20 PM' },
    ],
  },
];
