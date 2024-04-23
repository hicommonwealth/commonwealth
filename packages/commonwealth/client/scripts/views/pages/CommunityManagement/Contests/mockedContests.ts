const now = new Date();

const mockedContests = [
  {
    id: 1,
    name: '6 days',
    imageUrl: 'https://fakeimg.pl/1200x400',
    finishDate: new Date(now.getTime() + 6 * 24 * 60 * 60 * 1000).toISOString(),
    topics: ['General', 'Proposals', 'Announcements'],
    payouts: [0.00444, 0.00333, 0.00222, 0.00111, 0.00011, 0.00222],
    isActive: true,
  },
  {
    id: 3,
    name: '21 hours',
    finishDate: new Date(now.getTime() + 21 * 60 * 60 * 1000).toISOString(),

    topics: ['General', 'Proposals', 'Announcements'],
    payouts: [0.00444, 0.00333, 0.00222, 0.00111],
    isActive: true,
  },
  {
    id: 3,
    name: '3 hours',
    finishDate: new Date(now.getTime() + 3 * 60 * 60 * 1000).toISOString(),

    topics: ['General', 'Proposals', 'Announcements'],
    payouts: [0.00444, 0.00333, 0.00222, 0.00111],
    isActive: true,
  },
  {
    id: 4,
    name: '2 hours',
    finishDate: new Date(now.getTime() + 2 * 60 * 60 * 1000).toISOString(),

    topics: ['General', 'Proposals', 'Announcements'],
    payouts: [0.00444, 0.00333, 0.00222, 0.00111],
    isActive: true,
  },
  {
    id: 5,
    name: '1 hours 20 min ',
    finishDate: new Date(
      now.getTime() + (1 * 60 + 20) * 60 * 1000,
    ).toISOString(),
    topics: ['General', 'Proposals', 'Announcements'],
    payouts: [0.00444, 0.00333, 0.00222, 0.00111],
    isActive: true,
  },
  {
    id: 1,
    name: '61 min',
    imageUrl: 'https://fakeimg.pl/1200x400',
    finishDate: new Date(now.getTime() + 61 * 60 * 1000).toISOString(),
    topics: ['General', 'Proposals', 'Announcements'],
    payouts: [0.00444, 0.00333, 0.00222, 0.00111, 0.00011, 0.00222],
    isActive: false,
  },
  {
    id: 3,
    name: '59 min',
    finishDate: new Date(now.getTime() + 59 * 60 * 1000).toISOString(),
    topics: ['General', 'Proposals', 'Announcements'],
    payouts: [0.00444, 0.00333, 0.00222, 0.00111],
    isActive: true,
  },
  {
    id: 3,
    name: '60 seconds',
    finishDate: new Date(now.getTime() + 60 * 1000).toISOString(),
    topics: ['General', 'Proposals', 'Announcements'],
    payouts: [0.00444, 0.00333, 0.00222, 0.00111],
    isActive: true,
  },
  {
    id: 4,
    name: '59 seconds',
    finishDate: new Date(now.getTime() + 59 * 1000).toISOString(),
    topics: ['General', 'Proposals', 'Announcements'],
    payouts: [0.00444, 0.00333, 0.00222, 0.00111],
    isActive: false,
  },
];

export default mockedContests;
