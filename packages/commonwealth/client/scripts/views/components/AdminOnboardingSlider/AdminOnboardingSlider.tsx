import { ChainBase } from '@hicommonwealth/shared';
import { useFlag } from 'hooks/useFlag';
import useUserActiveAccount from 'hooks/useUserActiveAccount';
import { useCommonNavigate } from 'navigation/helpers';
import React, { useState } from 'react';
import app from 'state';
import { useFetchGroupsQuery } from 'state/api/groups';
import { useFetchThreadsQuery } from 'state/api/threads';
import { useFetchTopicsQuery } from 'state/api/topics';
import useAdminOnboardingSliderMutationStore from 'state/ui/adminOnboardingCards';
import Permissions from 'utils/Permissions';
import CWPageLayout from 'views/components/component_kit/new_designs/CWPageLayout';
import useCommunityContests from 'views/pages/CommunityManagement/Contests/useCommunityContests';
import { CWText } from '../component_kit/cw_text';
import { CWButton } from '../component_kit/new_designs/CWButton';
import { CWModal } from '../component_kit/new_designs/CWModal';
import { AdminOnboardingCard } from './AdminOnboardingCard/AdminOnboardingCard';
import './AdminOnboardingSlider.scss';
import { DismissModal } from './DismissModal';

export const AdminOnboardingSlider = () => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const contestEnabled = useFlag('contest');

  const navigate = useCommonNavigate();

  const community = app.config.chains.getById(app.activeChainId());
  const integrations = {
    snapshot: community?.snapshot?.length > 0,
    discordBot: community?.discordConfigId !== null,
    discordBotWebhooksEnabled: community?.discordBotWebhooksEnabled,
  };
  const hasAnyIntegration =
    integrations.snapshot ||
    integrations.discordBot ||
    integrations.discordBotWebhooksEnabled;

  const {
    shouldHideAdminCardsTemporary,
    shouldHideAdminCardsPermanently,
    setShouldHideAdminOnboardingCardsForCommunity,
  } = useAdminOnboardingSliderMutationStore();

  useUserActiveAccount();

  const { contestsData, isContestDataLoading } = useCommunityContests();

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

  const { data: threadCount = [], isLoading: isLoadingThreads = false } =
    useFetchThreadsQuery({
      communityId: app.activeChainId(),
      queryType: 'count',
      limit: 1,
      apiEnabled: !!app.activeChainId(),
    });

  const redirectToPage = (
    pageName:
      | 'launch-contest'
      | 'create-group'
      | 'create-thread'
      | 'manage-integrations'
      | 'create-topic',
  ) => {
    pageName === 'launch-contest' && navigate(`/manage/contests`);
    pageName === 'create-group' && navigate(`/members/groups/create`);
    pageName === 'create-thread' && navigate(`/new/discussion`);
    pageName === 'manage-integrations' && navigate(`/manage/integrations`);
    pageName === 'create-topic' && navigate('/manage/topics');
  };

  const isEvmCommunity = community?.base === ChainBase.Ethereum;
  const isContestActionCompleted =
    contestEnabled && isEvmCommunity && contestsData?.length > 0;

  if (
    !app.activeChainId() ||
    isContestDataLoading ||
    isLoadingTopics ||
    isLoadingGroups ||
    isLoadingThreads ||
    (isContestActionCompleted &&
      topics.length > 0 &&
      groups.length > 0 &&
      threadCount > 0 &&
      hasAnyIntegration) ||
    !(Permissions.isSiteAdmin() || Permissions.isCommunityAdmin()) ||
    [
      ...shouldHideAdminCardsTemporary,
      ...shouldHideAdminCardsPermanently,
    ].includes(app.activeChainId())
  ) {
    return;
  }

  return (
    <>
      <CWPageLayout className="AdminOnboardingSliderPageLayout">
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
            {contestEnabled && isEvmCommunity && (
              <AdminOnboardingCard
                cardType="launch-contest"
                isActionCompleted={contestsData?.length > 0}
                onCTAClick={() => redirectToPage('launch-contest')}
              />
            )}
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
              isActionCompleted={threadCount > 0}
              onCTAClick={() => redirectToPage('create-thread')}
            />
          </div>
        </section>
      </CWPageLayout>
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
