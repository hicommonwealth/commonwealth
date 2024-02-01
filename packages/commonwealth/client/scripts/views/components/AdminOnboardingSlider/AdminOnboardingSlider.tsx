import { featureFlags } from 'helpers/feature-flags';
import useUserActiveAccount from 'hooks/useUserActiveAccount';
import { useCommonNavigate } from 'navigation/helpers';
import React, { useState } from 'react';
import app from 'state';
import { useFetchGroupsQuery } from 'state/api/groups';
import { useFetchThreadsQuery } from 'state/api/threads';
import { useFetchTopicsQuery } from 'state/api/topics';
import useAdminOnboardingSliderMutationStore from 'state/ui/adminOnboardingCards';
import Permissions from 'utils/Permissions';
import { CWText } from '../component_kit/cw_text';
import { CWModal } from '../component_kit/new_designs/CWModal';
import { CWButton } from '../component_kit/new_designs/cw_button';
import { AdminOnboardingCard } from './AdminOnboardingCard/AdminOnboardingCard';
import './AdminOnboardingSlider.scss';
import { DismissModal } from './DismissModal';

export const AdminOnboardingSlider = () => {
  useUserActiveAccount();

  const community = app.config.chains.getById(app.activeChainId());
  const integrations = {
    snapshot: community?.snapshot?.length > 0,
    discodBot: community?.discordConfigId !== null,
    discordBotWebhooksEnabled: community?.discordBotWebhooksEnabled,
  };
  const hasAnyIntegration =
    integrations.snapshot ||
    integrations.discodBot ||
    integrations.discordBotWebhooksEnabled;

  const navigate = useCommonNavigate();
  const {
    shouldHideAdminCardsTemporary,
    shouldHideAdminCardsPermanently,
    setShouldHideAdminOnboardingCardsForCommunity,
  } = useAdminOnboardingSliderMutationStore();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const { data: topics = [], isLoading: isLoadingTopics = false } =
    useFetchTopicsQuery({
      communityId: app.activeChainId(),
      apiEnabled: !!app.activeChainId(),
    });
  const { data: groups = [], isLoading: isLoadingGroups = false } =
    useFetchGroupsQuery({
      communityId: app.activeChainId(),
      enabled: !!app.activeChainId(),
    });
  const { data: threads = [], isLoading: isLoadingThreads = false } =
    useFetchThreadsQuery({
      communityId: app.activeChainId(),
      queryType: 'bulk',
      page: 1,
      limit: 20,
      apiEnabled: !!app.activeChainId(),
    });

  const redirectToPage = (
    pageName:
      | 'create-group'
      | 'create-thread'
      | 'manage-integrations'
      | 'create-topic',
  ) => {
    pageName === 'create-group' && navigate(`/members/groups/create`);
    pageName === 'create-thread' && navigate(`/new/discussion`);
    pageName === 'manage-integrations' && navigate(`/manage/integrations`);
    pageName === 'create-topic' && navigate('/manage/topics');
  };

  if (
    !app.activeChainId() ||
    isLoadingTopics ||
    isLoadingGroups ||
    isLoadingThreads ||
    (topics.length > 0 &&
      groups.length > 0 &&
      threads.length > 0 &&
      hasAnyIntegration) ||
    !(Permissions.isSiteAdmin() || Permissions.isCommunityAdmin()) ||
    !featureFlags.newAdminOnboardingEnabled ||
    [
      ...shouldHideAdminCardsTemporary,
      ...shouldHideAdminCardsPermanently,
    ].includes(app.activeChainId())
  ) {
    return;
  }

  return (
    <>
      <section className="AdminOnboardingSlider">
        <div className="header">
          <CWText type="h4">Finish setting up your community</CWText>

          <CWButton
            containerClassName="dismissBtn"
            buttonType="tertiary"
            buttonWidth="narrow"
            onClick={() => {
              setIsModalVisible(true);
            }}
            label="Dismiss"
          />
        </div>
        <div className="cards">
          <AdminOnboardingCard
            cardType="create-topic"
            isActionCompleted={topics.length > 1} // we have a default 'General' topic which is not counted here
            onCTAClick={() => redirectToPage('create-topic')}
          />
          <AdminOnboardingCard
            cardType="make-group"
            isActionCompleted={groups.length > 0}
            onCTAClick={() => redirectToPage('create-group')}
          />
          <AdminOnboardingCard
            cardType="enable-integrations"
            isActionCompleted={hasAnyIntegration}
            onCTAClick={() => redirectToPage('manage-integrations')}
          />
          <AdminOnboardingCard
            cardType="create-thread"
            isActionCompleted={threads.length > 0}
            onCTAClick={() => redirectToPage('create-thread')}
          />
        </div>
      </section>
      <CWModal
        size="small"
        visibleOverflow
        content={
          <DismissModal
            onModalClose={() => setIsModalVisible(false)}
            onDismiss={(shouldDismissPermanently) => {
              setIsModalVisible(false);
              setShouldHideAdminOnboardingCardsForCommunity(
                app.activeChainId(),
                shouldDismissPermanently,
              );
            }}
          />
        }
        onClose={() => setIsModalVisible(false)}
        open={isModalVisible}
      />
    </>
  );
};
