import useUserLoggedIn from 'client/scripts/hooks/useUserLoggedIn';
import app from 'client/scripts/state';
import { useFetchSelfProfileQuery } from 'client/scripts/state/api/profiles';
import { useCommonNavigate } from 'navigation/helpers';
import React, { useEffect } from 'react';
import useUserOnboardingSliderMutationStore from 'state/ui/userTrainingCards';
import CWPageLayout from 'views/components/component_kit/new_designs/CWPageLayout';
import { ActionCard } from '../ActionCard';
import { CWText } from '../component_kit/cw_text';
import { CWButton } from '../component_kit/new_designs/CWButton';
import './UserTrainingSlider.scss';
import { UserTrainingCardTypes } from './types';

const CARD_TYPES = {
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

export const UserTrainingSlider = () => {
  const { isLoggedIn } = useUserLoggedIn();
  const navigate = useCommonNavigate();
  const profileId = app?.user?.addresses?.[0]?.profile?.id;

  const { data: profile, isLoading: isLoadingProfile } =
    useFetchSelfProfileQuery({
      apiCallEnabled: isLoggedIn,
    });

  const {
    cardTempMarkedAsCompleted,
    setCardTempMarkedAsCompleted,
    unsetCardTempMarkedAsCompleted,
    clearCardsTempMarkedAsCompleted,
    shouldHideTrainingCardsPermanently,
    setShouldHideTrainingCardsPermanently,
  } = useUserOnboardingSliderMutationStore();

  const hideAllCards = () => {
    setShouldHideTrainingCardsPermanently(
      profileId,
      UserTrainingCardTypes.GiveUpvote,
    );
    setShouldHideTrainingCardsPermanently(
      profileId,
      UserTrainingCardTypes.CreateContent,
    );
    setShouldHideTrainingCardsPermanently(
      profileId,
      UserTrainingCardTypes.FinishProfile,
    );
    setShouldHideTrainingCardsPermanently(
      profileId,
      UserTrainingCardTypes.ExploreCommunities,
    );
  };

  const hideCardPermanently = (cardName: UserTrainingCardTypes) => {
    setShouldHideTrainingCardsPermanently(profileId, cardName);
    unsetCardTempMarkedAsCompleted(cardName);
  };

  const markExploreCommunitiesActionAsComplete = () => {
    // once a user visits communities page, this action is complete
    setCardTempMarkedAsCompleted(UserTrainingCardTypes.ExploreCommunities);
    setShouldHideTrainingCardsPermanently(
      profileId,
      UserTrainingCardTypes.ExploreCommunities,
    );
  };

  const redirectToPage = (pageName: UserTrainingCardTypes) => {
    pageName === UserTrainingCardTypes.GiveUpvote &&
      navigate(`/dashboard/for-you`, {}, null);
    pageName === UserTrainingCardTypes.CreateContent &&
      navigate(`/dashboard/for-you`, {}, null);
    pageName === UserTrainingCardTypes.FinishProfile &&
      navigate(`/profile/edit`, {}, null);
    pageName === UserTrainingCardTypes.ExploreCommunities &&
      navigate(`/communities`, {}, null);
  };

  useEffect(() => {
    if (!isLoggedIn && cardTempMarkedAsCompleted.length > 0) {
      clearCardsTempMarkedAsCompleted();
    }
  }, [isLoggedIn, cardTempMarkedAsCompleted, clearCardsTempMarkedAsCompleted]);

  useEffect(() => {
    // if user has email, then hide `finish-profile` card
    if (isLoggedIn && app?.user?.email && profileId) {
      setShouldHideTrainingCardsPermanently(
        profileId,
        UserTrainingCardTypes.FinishProfile,
      );
    }
  }, [
    isLoggedIn,
    profileId,
    shouldHideTrainingCardsPermanently,
    setShouldHideTrainingCardsPermanently,
  ]);

  useEffect(() => {
    if (isLoggedIn) {
      // if user has any social links, then hide `finish-profile` card
      if (
        (profile?.profile?.socials || []).filter(
          (link) => link.trim().length > 0,
        )?.length > 0 &&
        profileId
      ) {
        setShouldHideTrainingCardsPermanently(
          profileId,
          UserTrainingCardTypes.FinishProfile,
        );
      }

      // if user has created any comment/thread, then hide `create-content` card
      if (
        !isLoadingProfile &&
        (profile?.comments?.length > 0 || profile?.threads?.length > 0)
      ) {
        setShouldHideTrainingCardsPermanently(
          profileId,
          UserTrainingCardTypes.CreateContent,
        );
      }
    }
  }, [
    isLoggedIn,
    isLoadingProfile,
    profile,
    profileId,
    shouldHideTrainingCardsPermanently,
    setShouldHideTrainingCardsPermanently,
  ]);

  if (
    !isLoggedIn ||
    isLoadingProfile ||
    (shouldHideTrainingCardsPermanently?.[profileId]?.length === 4 &&
      cardTempMarkedAsCompleted.length === 0)
  ) {
    return;
  }

  const isGiveUpvoteCardVisible =
    cardTempMarkedAsCompleted.includes(UserTrainingCardTypes.GiveUpvote) ||
    !shouldHideTrainingCardsPermanently?.[profileId]?.includes(
      UserTrainingCardTypes.GiveUpvote,
    );
  const isCreateContentCardVisible =
    cardTempMarkedAsCompleted.includes(UserTrainingCardTypes.CreateContent) ||
    !shouldHideTrainingCardsPermanently?.[profileId]?.includes(
      UserTrainingCardTypes.CreateContent,
    );
  const isFinishProfileCardVisible =
    cardTempMarkedAsCompleted.includes(UserTrainingCardTypes.FinishProfile) ||
    !shouldHideTrainingCardsPermanently?.[profileId]?.includes(
      UserTrainingCardTypes.FinishProfile,
    );
  const isExploreCommunitiesCardVisible =
    cardTempMarkedAsCompleted.includes(
      UserTrainingCardTypes.ExploreCommunities,
    ) ||
    !shouldHideTrainingCardsPermanently?.[profileId]?.includes(
      UserTrainingCardTypes.ExploreCommunities,
    );

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
          {isGiveUpvoteCardVisible && (
            <ActionCard
              ctaText={CARD_TYPES[UserTrainingCardTypes.GiveUpvote].ctaText}
              title={CARD_TYPES[UserTrainingCardTypes.GiveUpvote].title}
              description={
                CARD_TYPES[UserTrainingCardTypes.GiveUpvote].description
              }
              iconURL={CARD_TYPES[UserTrainingCardTypes.GiveUpvote].iconURL}
              iconAlt="give-upvote-icon"
              canClose
              onClose={() =>
                hideCardPermanently(UserTrainingCardTypes.GiveUpvote)
              }
              isActionCompleted={cardTempMarkedAsCompleted.includes(
                UserTrainingCardTypes.GiveUpvote,
              )}
              onCTAClick={() =>
                redirectToPage(UserTrainingCardTypes.GiveUpvote)
              }
            />
          )}
          {isCreateContentCardVisible && (
            <ActionCard
              ctaText={CARD_TYPES[UserTrainingCardTypes.CreateContent].ctaText}
              title={CARD_TYPES[UserTrainingCardTypes.CreateContent].title}
              description={
                CARD_TYPES[UserTrainingCardTypes.CreateContent].description
              }
              iconURL={CARD_TYPES[UserTrainingCardTypes.CreateContent].iconURL}
              iconAlt="create-content-icon"
              canClose
              onClose={() =>
                hideCardPermanently(UserTrainingCardTypes.CreateContent)
              }
              isActionCompleted={cardTempMarkedAsCompleted.includes(
                UserTrainingCardTypes.CreateContent,
              )}
              onCTAClick={() =>
                redirectToPage(UserTrainingCardTypes.CreateContent)
              }
            />
          )}
          {isFinishProfileCardVisible && (
            <ActionCard
              ctaText={CARD_TYPES[UserTrainingCardTypes.FinishProfile].ctaText}
              title={CARD_TYPES[UserTrainingCardTypes.FinishProfile].title}
              description={
                CARD_TYPES[UserTrainingCardTypes.FinishProfile].description
              }
              iconURL={CARD_TYPES[UserTrainingCardTypes.FinishProfile].iconURL}
              iconAlt="finish-profile-icon"
              canClose
              onClose={() =>
                hideCardPermanently(UserTrainingCardTypes.FinishProfile)
              }
              isActionCompleted={cardTempMarkedAsCompleted.includes(
                UserTrainingCardTypes.FinishProfile,
              )}
              onCTAClick={() =>
                redirectToPage(UserTrainingCardTypes.FinishProfile)
              }
            />
          )}
          {isExploreCommunitiesCardVisible && (
            <ActionCard
              ctaText={
                CARD_TYPES[UserTrainingCardTypes.ExploreCommunities].ctaText
              }
              title={CARD_TYPES[UserTrainingCardTypes.ExploreCommunities].title}
              description={
                CARD_TYPES[UserTrainingCardTypes.ExploreCommunities].description
              }
              iconURL={
                CARD_TYPES[UserTrainingCardTypes.ExploreCommunities].iconURL
              }
              iconAlt="explore-communities-icon"
              canClose
              onClose={() =>
                hideCardPermanently(UserTrainingCardTypes.ExploreCommunities)
              }
              isActionCompleted={cardTempMarkedAsCompleted.includes(
                UserTrainingCardTypes.ExploreCommunities,
              )}
              onCTAClick={() => {
                redirectToPage(UserTrainingCardTypes.ExploreCommunities);

                markExploreCommunitiesActionAsComplete();
              }}
            />
          )}
        </div>
      </section>
    </CWPageLayout>
  );
};
