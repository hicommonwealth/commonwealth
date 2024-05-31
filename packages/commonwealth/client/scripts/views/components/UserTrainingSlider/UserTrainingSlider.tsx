import useUserLoggedIn from 'client/scripts/hooks/useUserLoggedIn';
import app from 'client/scripts/state';
import { useFetchProfilesByIdQuery } from 'client/scripts/state/api/profiles';
import useAdminActionCardsStore from 'client/scripts/state/ui/adminOnboardingCards';
import { useCommonNavigate } from 'navigation/helpers';
import React, { useEffect, useState } from 'react';
import useUserOnboardingSliderMutationStore from 'state/ui/userTrainingCards';
import CWPageLayout from 'views/components/component_kit/new_designs/CWPageLayout';
import { ActionCard } from '../ActionCard';
import { CWText } from '../component_kit/cw_text';
import { CWButton } from '../component_kit/new_designs/CWButton';
import { CWModal } from '../component_kit/new_designs/CWModal';
import { DismissModal } from './DismissModal';
import './UserTrainingSlider.scss';
import { CARD_TYPES } from './constants';
import { UserTrainingCardTypes } from './types';

export const UserTrainingSlider = () => {
  const { isLoggedIn } = useUserLoggedIn();
  const navigate = useCommonNavigate();
  const profileId = app?.user?.addresses?.[0]?.profile?.id;

  const [cardToDismiss, setCardToDismiss] = useState<
    UserTrainingCardTypes | 'all'
  >();

  const { data: profile, isLoading: isLoadingProfile } =
    useFetchProfilesByIdQuery({
      apiCallEnabled: isLoggedIn,
    });

  const { isVisible: isAdminSliderVisible } = useAdminActionCardsStore();

  const {
    completedActions,
    clearCompletedActionsState,
    markTrainingActionAsComplete,
    trainingActionPermanentlyHidden,
    markTrainingActionAsPermanentlyHidden,
  } = useUserOnboardingSliderMutationStore();

  const hideAllCards = () => {
    [
      UserTrainingCardTypes.GiveUpvote,
      UserTrainingCardTypes.CreateContent,
      UserTrainingCardTypes.FinishProfile,
      UserTrainingCardTypes.ExploreCommunities,
    ].map((card) => markTrainingActionAsPermanentlyHidden(card, profileId));
  };

  const isCardVisible = (cardName: UserTrainingCardTypes) => {
    return (
      completedActions.includes(cardName) ||
      !trainingActionPermanentlyHidden?.[profileId]?.includes(cardName)
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

  const handleModalClose = () => {
    setCardToDismiss(undefined);
  };

  const handleModalDismiss = () => {
    if (cardToDismiss === 'all') {
      hideAllCards();
    } else {
      markTrainingActionAsPermanentlyHidden(cardToDismiss, profileId);
    }
    setCardToDismiss(undefined);
  };

  useEffect(() => {
    if (!isLoggedIn && completedActions.length > 0) {
      clearCompletedActionsState();
    }
  }, [isLoggedIn, completedActions, clearCompletedActionsState]);

  useEffect(() => {
    if (isLoggedIn && !isLoadingProfile && profile && profileId) {
      // if user has already given any upvotes, then hide `give-upvote` card
      if (
        profile?.totalUpvotes > 0 &&
        !trainingActionPermanentlyHidden?.[profileId]?.includes(
          UserTrainingCardTypes.GiveUpvote,
        )
      ) {
        markTrainingActionAsPermanentlyHidden(
          UserTrainingCardTypes.GiveUpvote,
          profileId,
        );
      }

      // if user has any social links or email, then hide `finish-profile` card
      const hasSocialLinks =
        (profile?.profile?.socials || []).filter(
          (link) => link.trim().length > 0,
        )?.length > 0;
      if (
        (hasSocialLinks || app?.user?.email) &&
        !trainingActionPermanentlyHidden?.[profileId]?.includes(
          UserTrainingCardTypes.FinishProfile,
        )
      ) {
        markTrainingActionAsPermanentlyHidden(
          UserTrainingCardTypes.FinishProfile,
          profileId,
        );
      }

      // if user has created any comment/thread, then hide `create-content` card
      if (
        (profile?.comments?.length > 0 || profile?.threads?.length > 0) &&
        !trainingActionPermanentlyHidden?.[profileId]?.includes(
          UserTrainingCardTypes.CreateContent,
        )
      ) {
        markTrainingActionAsPermanentlyHidden(
          UserTrainingCardTypes.CreateContent,
          profileId,
        );
      }
    }
  }, [
    isLoggedIn,
    isLoadingProfile,
    profile,
    profileId,
    trainingActionPermanentlyHidden,
    markTrainingActionAsPermanentlyHidden,
  ]);

  if (
    !isLoggedIn ||
    isLoadingProfile ||
    (trainingActionPermanentlyHidden?.[profileId]?.length === 4 &&
      completedActions.length === 0) ||
    isAdminSliderVisible // if admin slider is visible, we hide user training slider
  ) {
    return;
  }

  return (
    <>
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
              onClick={() => setCardToDismiss('all')}
              label="Dismiss all"
            />
          </div>
          <div className="cards">
            {isCardVisible(UserTrainingCardTypes.GiveUpvote) && (
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
                  setCardToDismiss(UserTrainingCardTypes.GiveUpvote)
                }
                isActionCompleted={completedActions.includes(
                  UserTrainingCardTypes.GiveUpvote,
                )}
                onCTAClick={() =>
                  redirectToPage(UserTrainingCardTypes.GiveUpvote)
                }
              />
            )}
            {isCardVisible(UserTrainingCardTypes.CreateContent) && (
              <ActionCard
                ctaText={
                  CARD_TYPES[UserTrainingCardTypes.CreateContent].ctaText
                }
                title={CARD_TYPES[UserTrainingCardTypes.CreateContent].title}
                description={
                  CARD_TYPES[UserTrainingCardTypes.CreateContent].description
                }
                iconURL={
                  CARD_TYPES[UserTrainingCardTypes.CreateContent].iconURL
                }
                iconAlt="create-content-icon"
                canClose
                onClose={() =>
                  setCardToDismiss(UserTrainingCardTypes.CreateContent)
                }
                isActionCompleted={completedActions.includes(
                  UserTrainingCardTypes.CreateContent,
                )}
                onCTAClick={() =>
                  redirectToPage(UserTrainingCardTypes.CreateContent)
                }
              />
            )}
            {isCardVisible(UserTrainingCardTypes.FinishProfile) && (
              <ActionCard
                ctaText={
                  CARD_TYPES[UserTrainingCardTypes.FinishProfile].ctaText
                }
                title={CARD_TYPES[UserTrainingCardTypes.FinishProfile].title}
                description={
                  CARD_TYPES[UserTrainingCardTypes.FinishProfile].description
                }
                iconURL={
                  CARD_TYPES[UserTrainingCardTypes.FinishProfile].iconURL
                }
                iconAlt="finish-profile-icon"
                canClose
                onClose={() =>
                  setCardToDismiss(UserTrainingCardTypes.FinishProfile)
                }
                isActionCompleted={completedActions.includes(
                  UserTrainingCardTypes.FinishProfile,
                )}
                onCTAClick={() =>
                  redirectToPage(UserTrainingCardTypes.FinishProfile)
                }
              />
            )}
            {isCardVisible(UserTrainingCardTypes.ExploreCommunities) && (
              <ActionCard
                ctaText={
                  CARD_TYPES[UserTrainingCardTypes.ExploreCommunities].ctaText
                }
                title={
                  CARD_TYPES[UserTrainingCardTypes.ExploreCommunities].title
                }
                description={
                  CARD_TYPES[UserTrainingCardTypes.ExploreCommunities]
                    .description
                }
                iconURL={
                  CARD_TYPES[UserTrainingCardTypes.ExploreCommunities].iconURL
                }
                iconAlt="explore-communities-icon"
                canClose
                onClose={() =>
                  setCardToDismiss(UserTrainingCardTypes.ExploreCommunities)
                }
                isActionCompleted={completedActions.includes(
                  UserTrainingCardTypes.ExploreCommunities,
                )}
                onCTAClick={() => {
                  redirectToPage(UserTrainingCardTypes.ExploreCommunities);

                  markTrainingActionAsComplete(
                    UserTrainingCardTypes.ExploreCommunities,
                    profileId,
                  );
                }}
              />
            )}
          </div>
        </section>
      </CWPageLayout>
      <CWModal
        size="small"
        visibleOverflow
        content={
          <DismissModal
            onModalClose={handleModalClose}
            onDismiss={handleModalDismiss}
          />
        }
        onClose={handleModalClose}
        open={!!cardToDismiss}
      />
    </>
  );
};
