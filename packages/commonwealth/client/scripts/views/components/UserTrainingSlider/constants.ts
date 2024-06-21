import shape10Svg from 'assets/img/shapes/shape10.svg';
import shape7Svg from 'assets/img/shapes/shape7.svg';
import shape8Svg from 'assets/img/shapes/shape8.svg';
import shape9Svg from 'assets/img/shapes/shape9.svg';
import { UserTrainingCardTypes } from './types';

export const CARD_TYPES = {
  [UserTrainingCardTypes.GiveUpvote]: {
    iconURL: shape7Svg,
    title: 'Give an upvote',
    description: 'Show your support for a comment or thread by upvoting it!',
    ctaText: 'Like a thread',
  },
  [UserTrainingCardTypes.CreateContent]: {
    iconURL: shape8Svg,
    title: 'Make a post or comment',
    description: 'Share your thoughts to contribute to a community.',
    ctaText: 'Say hello',
  },
  [UserTrainingCardTypes.FinishProfile]: {
    iconURL: shape9Svg,
    title: 'Finish your profile',
    description:
      'Check out your profile page to add any socials or additional information.',
    ctaText: 'Complete profile',
  },
  [UserTrainingCardTypes.ExploreCommunities]: {
    iconURL: shape10Svg,
    title: 'Explore communities',
    description: 'Check out other Communities on Common.',
    ctaText: 'Explore',
  },
};
