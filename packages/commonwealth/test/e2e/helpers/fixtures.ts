/**
 * Test fixtures matching the seeded data from libs/model/src/tester/e2eSeeds.ts
 */

export const TEST_USERS = {
  USER_1: {
    id: -1,
    email: 'test-1@gmail.com',
    profileName: 'testName-1',
  },
  USER_2: {
    id: -2,
    email: 'test0@gmail.com',
    profileName: 'testName-2',
  },
  USER_3: {
    id: -3,
    email: 'test1@gmail.com',
    profileName: 'testName-3',
  },
  USER_4: {
    id: -4,
    email: 'test2@gmail.com',
    profileName: 'testName-4',
  },
} as const;

export const TEST_ADDRESSES = {
  ADDRESS_1: '0x834731c87A7a6f8B57F4aa42c205265EAcbFCCD7',
  ADDRESS_2: '0x7EcA9278094511486506bb34B31087df7C25Db6f',
  ADDRESS_3: '0xd65FA09DE724f0D68EcbF5e0e186d3d59080172C',
  ADDRESS_4: '0x89F40750d76D646c2f822E4Dd6Ea1558A83eDb82',
} as const;

export const TEST_COMMUNITIES = {
  COMMUNITY_1: {
    id: 'cmntest',
    name: 'cmntest',
    chainNodeId: 9999,
  },
  COMMUNITY_2: {
    id: 'cmntest2',
    name: 'cmntest2',
    chainNodeId: 99999,
  },
} as const;

export const TEST_TOPICS = {
  TOPIC_1: { id: -1, name: 'testTopic', communityId: 'cmntest' },
  TOPIC_2: { id: -2, name: 'testTopic2', communityId: 'cmntest' },
} as const;

export const TEST_THREADS = {
  THREAD_1: { id: -1, topicId: -1, communityId: 'cmntest' },
  THREAD_2: { id: -2, topicId: -1, communityId: 'cmntest' },
  THREAD_3: { id: -3, topicId: -2, communityId: 'cmntest' },
  THREAD_4: { id: -4, topicId: -2, communityId: 'cmntest' },
  THREAD_5: { id: -5, topicId: -2, communityId: 'cmntest' },
} as const;
