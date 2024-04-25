const now = new Date();

const mockedContests = [
  {
    id: 1,
    name: 'First',
    imageUrl:
      'https://ethereum.org/_next/image/?url=%2F_next%2Fstatic%2Fmedia%2Fcommunity-hero.89b5ba2f.png&w=1920&q=75',
    finishDate: new Date(now.getTime() + 6 * 24 * 60 * 60 * 1000).toISOString(),
    topics: ['General', 'Proposals', 'Announcements'],
    payouts: [0.00444, 0.00333, 0.00222, 0.00111, 0.00011, 0.00222],
    isActive: true,
    address: '0xdFE9f89D91fF1E0D3ED5B0833E77d269f3a1A78d',
  },
  {
    id: 2,
    name: 'Second',
    finishDate: new Date(now.getTime() + 21 * 60 * 60 * 1000).toISOString(),

    topics: ['General', 'Proposals', 'Announcements'],
    payouts: [0.00444, 0.00333, 0.00222, 0.00111],
    isActive: true,
    address: '0x7ef5E6344B96d0E6AC2c921ce96a7898B73226Ee',
  },
  {
    id: 3,
    name: 'Third',
    finishDate: new Date(now.getTime() + 3 * 60 * 60 * 1000).toISOString(),
    imageUrl:
      'https://i.pinimg.com/736x/eb/d5/da/ebd5da714d3cefd9abfd0e376ec28f10.jpg',
    topics: ['General', 'Proposals', 'Announcements'],
    payouts: [0.00444, 0.00333, 0.00222, 0.00111],
    isActive: true,
    address: '0x502607Eb8152E30Ac46902C898DBCaDC1508a9a5',
  },
  {
    id: 4,
    name: 'Fourth',
    finishDate: new Date(now.getTime() + 2 * 60 * 60 * 1000).toISOString(),

    topics: ['General', 'Proposals', 'Announcements'],
    payouts: [0.00444, 0.00333, 0.00222, 0.00111],
    isActive: true,
    address: '0xf7B089b6a34e241C254DcB0dcb205aFc1AdD229d',
  },
  {
    id: 5,
    name: 'Fifth',
    finishDate: new Date(
      now.getTime() + (1 * 60 + 20) * 60 * 1000,
    ).toISOString(),
    topics: ['General', 'Proposals', 'Announcements'],
    payouts: [0.00444, 0.00333, 0.00222, 0.00111],
    isActive: true,
    address: '0xk563m89b6a34e241C254DcB0dcb205aFc1AdD229d',
  },
  {
    id: 6,
    name: 'Sixth',
    finishDate: new Date(now.getTime() + 61 * 60 * 1000).toISOString(),
    topics: ['General', 'Proposals', 'Announcements'],
    payouts: [0.00444, 0.00333, 0.00222, 0.00111, 0.00011, 0.00222],
    isActive: false,
    address: '0x4f23089b6a34e241C254DcB0dcb205aFc1AdD229d',
  },
  {
    id: 7,
    name: 'Seventh',
    finishDate: new Date(now.getTime() + 59 * 60 * 1000).toISOString(),
    topics: ['General', 'Proposals', 'Announcements'],
    payouts: [0.00444, 0.00333, 0.00222, 0.00111],
    isActive: true,
    address: '0xfsd089b6a34e241C254DcB0dcb205aFc1AdD229d',
  },
  {
    id: 8,
    name: 'Eighth',
    finishDate: new Date(now.getTime() + 60 * 1000).toISOString(),
    topics: ['General', 'Proposals', 'Announcements'],
    payouts: [0.00444, 0.00333, 0.00222, 0.00111],
    isActive: true,
    address: '0x123089b6a34e241C254DcB0dcb205aFc1AdD229d',
  },
  {
    id: 9,
    name: 'Ninth',
    finishDate: new Date(now.getTime() + 59 * 1000).toISOString(),
    topics: ['General', 'Proposals', 'Announcements'],
    payouts: [0.00444, 0.00333, 0.00222, 0.00111],
    isActive: false,
    address: '0xaa3089b6a34e241C254DcB0dcb205aFc1AdD229d',
  },
];

export default mockedContests;
