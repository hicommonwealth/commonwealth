import { UserTrainingCardTypes } from './types';

export const CARD_TYPES = {
  [UserTrainingCardTypes.GiveUpvote]: {
    iconURL: '/static/img/shapes/shape7.svg',
    title: 'Give an upvote',
    description: 'Show your support for a comment or thread by upvoting it!',
    ctaText: 'Like a thread',
  },
  [UserTrainingCardTypes.CreateContent]: {
    iconURL: '/static/img/shapes/shape8.svg',
    title: 'Make a post or comment',
    description: 'Share your thoughts to contribute to a community.',
    ctaText: 'Say hello',
  },
  [UserTrainingCardTypes.FinishProfile]: {
    iconURL: '/static/img/shapes/shape9.svg',
    title: 'Finish your profile',
    description:
      'Check out your profile page to add any socials or additional information.',
    ctaText: 'Complete profile',
  },
  [UserTrainingCardTypes.ExploreCommunities]: {
    iconURL: '/static/img/shapes/shape10.svg',
    title: 'Explore communities',
    description: 'Check out other Communities on Common.',
    ctaText: 'Explore',
  },
};
