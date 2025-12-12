export const books = [
  {
    id: '1',
    title: 'The Crimson Cipher',
    author: 'Alex Drake',
    synopsis: 'In a world where words hold power, a young scribe discovers a forbidden book that could unravel the fabric of reality. Hunted by a shadowy organization, she must decode its secrets before it\'s too late.',
    coverImageId: 'book-cover-1',
    hashtags: ['#fantasy', '#magic', '#adventure'],
    chapters: [
      { id: '1', title: 'The Forbidden Tome', wordCount: 2500 },
      { id: '2', title: 'Whispers in the Library', wordCount: 3100 },
      { id: '3', title: 'A Chase Through the Alleys', wordCount: 2800 },
    ],
  },
  {
    id: '2',
    title: 'Echoes of Andromeda',
    author: 'J.C. Mars',
    synopsis: 'A lone astronaut on a deep space mission awakens to find his ship adrift and his crew missing. His only companion is the ship\'s cryptic AI, which seems to know more than it lets on.',
    coverImageId: 'book-cover-3',
    hashtags: ['#scifi', '#mystery', '#thriller'],
    chapters: [
      { id: '1', title: 'Silence and Stars', wordCount: 4200 },
      { id: '2', title: 'The Ghost in the Machine', wordCount: 3800 },
    ],
  },
  {
    id: '3',
    title: 'The Last Love Letter',
    author: 'Emily Page',
    synopsis: 'A young woman finds a collection of unsent love letters in a vintage desk and embarks on a journey to find the intended recipient, discovering a love story that transcends time.',
    coverImageId: 'book-cover-6',
    hashtags: ['#romance', '#historical', '#feelgood'],
    chapters: [
      { id: '1', title: 'The Antique Desk', wordCount: 2200 },
      { id: '2', title: 'A Faded Address', wordCount: 2400 },
      { id: '3', title: 'Chasing a Ghost', wordCount: 2900 },
      { id: '4', title: 'The Meeting', wordCount: 3200 },
    ],
  },
  {
    id: '4',
    title: 'Shadow of the Spire',
    author: 'Kenji Tanaka',
    synopsis: 'In a city ruled by guilds, a young thief is framed for a crime she didn\'t commit. To clear her name, she must ascend the treacherous Spire, a dungeon of monsters and political intrigue.',
    coverImageId: 'book-cover-2',
    hashtags: ['#fantasy', '#dungeon', '#action'],
    chapters: [],
  },
  {
    id: '5',
    title: 'The Poet\'s Demise',
    author: 'Eleanor Vance',
    synopsis: 'A detective investigates the mysterious death of a renowned poet, diving into a world of literary rivalries, secret societies, and hidden verses that point to murder.',
    coverImageId: 'book-cover-4',
    hashtags: ['#mystery', '#crime', '#literary'],
    chapters: [],
  },
  {
    id: '6',
    title: 'Forest of Whispers',
    author: 'Liam O\'Connell',
    synopsis: 'When children start disappearing near the ancient woods, a local folklorist suspects a creature from old tales is to blame. He must convince the skeptical townsfolk before another child is taken.',
    coverImageId: 'book-cover-5',
    hashtags: ['#horror', '#folklore', '#supernatural'],
    chapters: [],
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
