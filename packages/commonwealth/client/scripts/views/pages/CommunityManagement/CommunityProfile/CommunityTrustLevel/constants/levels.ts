import { VerificationItemType, VerificationLevel } from '../types';

export const levels: VerificationLevel[] = [
  {
    level: 1,
    title: 'Unverified',
    description: 'Basic community without verification.',
    status: 'Not Started',
    color: 'green',
    items: [],
    redirect: false,
  },
  {
    level: 2,
    title: 'Social Verified',
    description: 'Basic verification through social media accounts.',
    status: 'Not Started',
    color: 'yellow',
    redirect: false,
  },
  {
    level: 3,
    title: 'Community Verified',
    description: 'Ownership of verified community or domain.',
    status: 'Not Started',
    color: 'gray',
    items: [
      {
        label: 'Verify Community',
        type: VerificationItemType.VERIFY_COMMUNITY,
        status: 'Not Started',
      },
      {
        label: 'Verify Domain Ownership',
        type: VerificationItemType.VERIFY_DOMAIN,
        status: 'Not Started',
      },
    ],
    redirect: true,
  },
  {
    level: 4,
    title: 'Manual Verification',
    description: 'Manually reviewed and verified by our team.',
    status: 'Not Started',
    color: 'gray',

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
