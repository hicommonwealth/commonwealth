import useUserLoggedIn from 'client/scripts/hooks/useUserLoggedIn';
import app from 'client/scripts/state';
import { useCommonNavigate } from 'navigation/helpers';
import React from 'react';
import useUserOnboardingSliderMutationStore from 'state/ui/userTrainingCards';
import CWPageLayout from 'views/components/component_kit/new_designs/CWPageLayout';
import { ActionCard } from '../ActionCard';
import { CWText } from '../component_kit/cw_text';
import { CWButton } from '../component_kit/new_designs/CWButton';
import './UserTrainingSlider.scss';

const CARD_TYPES = {
  'give-upvote': {
    iconURL: '/static/img/shapes/shape7.svg',
    title: 'Give an upvote',
    description: 'Show your support for a comment or thread by upvoting it!',
    ctaText: 'Like a thread',
  },
  'create-content': {
    iconURL: '/static/img/shapes/shape8.svg',
    title: 'Make a post or comment',
    description: 'Share your thoughts to contribute to a community.',
    ctaText: 'Say hello',
  },
  'finish-profile': {
    iconURL: '/static/img/shapes/shape9.svg',
    title: 'Finish your profile',
    description:
      'Check out your profile page to add any socials or additional information.',
    ctaText: 'Complete profile',
  },
  'explore-communities': {
    iconURL: '/static/img/shapes/shape10.svg',
    title: 'Explore communities',
    description: 'Check out other Communities on Common.',
    ctaText: 'Explore',
  },
};

export const UserTrainingSlider = () => {
  const { isLoggedIn } = useUserLoggedIn();
  const navigate = useCommonNavigate();
  const profileId = app?.user?.addresses?.[0]?.profile?.id;

  const {
    shouldHideTrainingCardsPermanently,
    setShouldHideTrainingCardsPermanently,
  } = useUserOnboardingSliderMutationStore();

  const hideAllCards = () => {
    setShouldHideTrainingCardsPermanently(profileId, 'give-upvote');
    setShouldHideTrainingCardsPermanently(profileId, 'create-content');
    setShouldHideTrainingCardsPermanently(profileId, 'finish-profile');
    setShouldHideTrainingCardsPermanently(profileId, 'explore-communities');
  };

  const redirectToPage = (
    pageName:
      | 'give-upvote'
      | 'create-content'
      | 'finish-profile'
      | 'explore-communities',
  ) => {
    pageName === 'give-upvote' && navigate(`/dashboard/for-you`, {}, null);
    pageName === 'create-content' && navigate(`/dashboard/for-you`, {}, null);
    pageName === 'finish-profile' && navigate(`/profile/edit`, {}, null);
    pageName === 'explore-communities' && navigate(`/communities`, {}, null);
  };

  if (
    !isLoggedIn ||
    shouldHideTrainingCardsPermanently?.[profileId]?.length === 4
  ) {
    return;
  }

  return (
    <CWPageLayout className="UserTrainingSliderPageLayout">
      <section className="UserTrainingSlider">
        <div className="header">
          <div className="left-section">
            <CWText type="h4" fontWeight="semiBold">
              Welcome to Common!
            </CWText>
            <CWText type="b1">
              Get the most out of your experience by completing these steps
            </CWText>
          </div>

          <CWButton
            containerClassName="dismissBtn"
            buttonType="tertiary"
            buttonWidth="narrow"
            buttonHeight="sm"
            onClick={hideAllCards}
            label="Dismiss all"
          />
        </div>
        <div className="cards">
          {!shouldHideTrainingCardsPermanently?.[profileId]?.includes(
            'give-upvote',
          ) && (
            <ActionCard
              ctaText={CARD_TYPES['give-upvote'].ctaText}
              title={CARD_TYPES['give-upvote'].title}
              description={CARD_TYPES['give-upvote'].description}
              iconURL={CARD_TYPES['give-upvote'].iconURL}
              iconAlt="give-upvote-icon"
              canClose
              onClose={() =>
                setShouldHideTrainingCardsPermanently(profileId, 'give-upvote')
              }
              onCTAClick={() => redirectToPage('give-upvote')}
            />
          )}
          {!shouldHideTrainingCardsPermanently?.[profileId]?.includes(
            'create-content',
          ) && (
            <ActionCard
              ctaText={CARD_TYPES['create-content'].ctaText}
              title={CARD_TYPES['create-content'].title}
              description={CARD_TYPES['create-content'].description}
              iconURL={CARD_TYPES['create-content'].iconURL}
              iconAlt="create-content-icon"
              canClose
              onClose={() =>
                setShouldHideTrainingCardsPermanently(
                  profileId,
                  'create-content',
                )
              }
              onCTAClick={() => redirectToPage('create-content')}
            />
          )}
          {!shouldHideTrainingCardsPermanently?.[profileId]?.includes(
            'finish-profile',
          ) && (
            <ActionCard
              ctaText={CARD_TYPES['finish-profile'].ctaText}
              title={CARD_TYPES['finish-profile'].title}
              description={CARD_TYPES['finish-profile'].description}
              iconURL={CARD_TYPES['finish-profile'].iconURL}
              iconAlt="finish-profile-icon"
              canClose
              onClose={() =>
                setShouldHideTrainingCardsPermanently(
                  profileId,
                  'finish-profile',
                )
              }
              onCTAClick={() => redirectToPage('finish-profile')}
            />
          )}
          {!shouldHideTrainingCardsPermanently?.[profileId]?.includes(
            'explore-communities',
          ) && (
            <ActionCard
              ctaText={CARD_TYPES['explore-communities'].ctaText}
              title={CARD_TYPES['explore-communities'].title}
              description={CARD_TYPES['explore-communities'].description}
              iconURL={CARD_TYPES['explore-communities'].iconURL}
              iconAlt="explore-communities-icon"
              canClose
              onClose={() =>
                setShouldHideTrainingCardsPermanently(
                  profileId,
                  'explore-communities',
                )
              }
              onCTAClick={() => redirectToPage('explore-communities')}
            />
          )}
        </div>
      </section>
    </CWPageLayout>
  );
};
