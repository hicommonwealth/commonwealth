import { VerificationLevel } from '../types';

export const levels: VerificationLevel[] = [
  {
    level: 1,
    title: 'Social Verified',
    description: 'Basic verification through social media accounts.',
    status: 'Not Started',
    color: 'green',
    items: [],
  },
  {
    level: 2,
    title: 'Community Verified',
    description: 'Ownership of verified community or domain',
    status: 'Not Started',
    color: 'yellow',
    items: [
      { label: 'Verify community', status: 'Not Started' },
      { label: 'Verify domain ownership', status: 'Not Started' },
    ],
  },
  {
    level: 3,
    title: 'Manual Verification',
    description: 'Manually reviewed and verified by our team',
    status: 'Not Started',
    color: 'gray',
    items: [],
  },
  {
    level: 4,
    title: 'Premium Verification',
    description: 'Highest level of trust with additional benefits.',
    status: 'Not Started',
    color: 'gray',
    items: [],
  },
];
