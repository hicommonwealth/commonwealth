import useUserLoggedIn from 'hooks/useUserLoggedIn';
import { useCommonNavigate } from 'navigation/helpers';
import React, { useEffect, useState } from 'react';
import { useFetchProfileByIdQuery } from 'state/api/profiles';
import useAdminActionCardsStore from 'state/ui/adminOnboardingCards';
import useUserStore from 'state/ui/user';
import useUserOnboardingSliderMutationStore from 'state/ui/userTrainingCards';
import { ActionCard, CardsSlider, DismissModal } from '../CardsSlider';
import { CWModal } from '../component_kit/new_designs/CWModal';
import './UserTrainingSlider.scss';
import { CARD_TYPES } from './constants';
import { UserTrainingCardTypes } from './types';

export const UserTrainingSlider = () => {
  const { isLoggedIn } = useUserLoggedIn();
  const navigate = useCommonNavigate();
  const user = useUserStore();
  const userId = user.id.toString();

  const [cardToDismiss, setCardToDismiss] = useState<
    UserTrainingCardTypes | 'all'
  >();

  const { data: profile, isLoading: isLoadingProfile } =
    useFetchProfileByIdQuery({
      apiCallEnabled: isLoggedIn,
      shouldFetchSelfProfile: true,
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
    ].map((card) => markTrainingActionAsPermanentlyHidden(card, userId));
  };

  const isCardVisible = (cardName: UserTrainingCardTypes) => {
    return (
      completedActions.includes(cardName) ||
      !trainingActionPermanentlyHidden?.[userId]?.includes(cardName)
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
      // @ts-expect-error <StrictNullChecks/>
      markTrainingActionAsPermanentlyHidden(cardToDismiss, userId);
    }
    setCardToDismiss(undefined);
  };

  useEffect(() => {
    if (!isLoggedIn && completedActions.length > 0) {
      clearCompletedActionsState();
    }
  }, [isLoggedIn, completedActions, clearCompletedActionsState]);

  useEffect(() => {
    if (isLoggedIn && !isLoadingProfile && profile && userId) {
      // if user has already given any upvotes, then hide `give-upvote` card
      if (
        profile?.totalUpvotes > 0 &&
        !trainingActionPermanentlyHidden?.[userId]?.includes(
          UserTrainingCardTypes.GiveUpvote,
        )
      ) {
        markTrainingActionAsPermanentlyHidden(
          UserTrainingCardTypes.GiveUpvote,
          userId,
        );
      }

      // if user has any social links or email, then hide `finish-profile` card
      const hasSocialLinks =
        (profile?.profile?.socials || []).filter(
          (link) => link.trim().length > 0,
        )?.length > 0;
      if (
        (hasSocialLinks || user.email) &&
        !trainingActionPermanentlyHidden?.[userId]?.includes(
          UserTrainingCardTypes.FinishProfile,
        )
      ) {
        markTrainingActionAsPermanentlyHidden(
          UserTrainingCardTypes.FinishProfile,
          userId,
        );
      }

      // if user has created any comment/thread, then hide `create-content` card
      if (
        (profile?.comments?.length > 0 || profile?.threads?.length > 0) &&
        !trainingActionPermanentlyHidden?.[userId]?.includes(
          UserTrainingCardTypes.CreateContent,
        )
      ) {
        markTrainingActionAsPermanentlyHidden(
          UserTrainingCardTypes.CreateContent,
          userId,
        );
      }
    }
  }, [
    user.email,
    isLoggedIn,
    isLoadingProfile,
    profile,
    userId,
    trainingActionPermanentlyHidden,
    markTrainingActionAsPermanentlyHidden,
  ]);

  if (
    !userId ||
    !isLoggedIn ||
    isLoadingProfile ||
    (trainingActionPermanentlyHidden?.[userId]?.length === 4 &&
      completedActions.length === 0) ||
    isAdminSliderVisible // if admin slider is visible, we hide user training slider
  ) {
    return;
  }

  return (
    <>
      <CardsSlider
        containerClassName="UserTrainingSliderPageLayout"
        className="UserTrainingSlider"
        headerText="Welcome to Common!"
        subHeaderText="Get the most out of your experience by completing these steps"
        dismissBtnLabel="Dismiss all"
        onDismiss={() => setCardToDismiss('all')}
      >
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
            onClose={() => setCardToDismiss(UserTrainingCardTypes.GiveUpvote)}
            isActionCompleted={completedActions.includes(
              UserTrainingCardTypes.GiveUpvote,
            )}
            onCTAClick={() => redirectToPage(UserTrainingCardTypes.GiveUpvote)}
          />
        )}
        {isCardVisible(UserTrainingCardTypes.CreateContent) && (
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
            ctaText={CARD_TYPES[UserTrainingCardTypes.FinishProfile].ctaText}
            title={CARD_TYPES[UserTrainingCardTypes.FinishProfile].title}
            description={
              CARD_TYPES[UserTrainingCardTypes.FinishProfile].description
            }
            iconURL={CARD_TYPES[UserTrainingCardTypes.FinishProfile].iconURL}
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
              setCardToDismiss(UserTrainingCardTypes.ExploreCommunities)
            }
            isActionCompleted={completedActions.includes(
              UserTrainingCardTypes.ExploreCommunities,
            )}
            onCTAClick={() => {
              redirectToPage(UserTrainingCardTypes.ExploreCommunities);

              markTrainingActionAsComplete(
                UserTrainingCardTypes.ExploreCommunities,
                userId,
              );
            }}
          />
        )}
      </CardsSlider>
      <CWModal
        size="small"
        visibleOverflow
        content={
          <DismissModal
            label="Dismiss item"
            description="Are you sure you'd like to dismiss?"
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
