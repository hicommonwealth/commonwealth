import { VerificationItemType, VerificationLevel } from '../types';

export const levels: VerificationLevel[] = [
  {
    level: 1,
    title: 'Wallet Verified',
    description: 'Verified wallet younger than 1 week.',
    status: 'Not Started',
    color: 'green',
    items: [],
    redirect: false,
  },
  {
    level: 2,
    title: 'Wallet and account age Verified',
    description: 'Verified wallet older than 1 week',
    status: 'Not Started',
    color: 'yellow',
    redirect: false,
  },
  {
    level: 3,
    title: 'Social Verified',
    description: 'Basic verification through social media accounts.',
    status: 'Not Started',
    color: 'gray',
    items: [
      {
        label: 'Verify Social Accounts',
        type: VerificationItemType.VERIFY_SOCIAL,
        status: 'Not Started',
      },
    ],
    redirect: true,
  },
  {
    level: 4,
    title: 'Chain Verified',
    description: 'Creator of a namespace, contest or launchpad token.',
    status: 'Not Started',
    color: 'gray',
    items: [
      {
        label: 'Launch a Coin',
        type: VerificationItemType.LAUNCH_COIN,
        status: 'Not Started',
      },
      {
        label: 'Verify Community',
        type: VerificationItemType.VERIFY_COMMUNITY,
        status: 'Not Started',
      },
      {
        label: 'Complete a Contest',
        type: VerificationItemType.COMPLETE_CONTEST,
        status: 'Not Started',
      },
    ],
    redirect: true,
  },
  {
    level: 5,
    title: 'Premium Verification',
    description: 'Highest level of trust with additional benefits.',
    status: 'Not Started',
    color: 'gray',
    items: [],
    redirect: false,
  },
];
