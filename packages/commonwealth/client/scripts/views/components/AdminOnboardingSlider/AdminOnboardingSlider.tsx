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
import { ActionCard } from '../ActionCard';
import { CWText } from '../component_kit/cw_text';
import { CWButton } from '../component_kit/new_designs/CWButton';
import { CWModal } from '../component_kit/new_designs/CWModal';
import './AdminOnboardingSlider.scss';
import { DismissModal } from './DismissModal';

const CARD_TYPES = {
  'launch-contest': {
    iconURL: '/static/img/shapes/shape1.svg',
    title: 'Launch a contest',
    description: 'Get your community engaged by launching a weekly contest',
    ctaText: 'Launch contest',
  },
  'create-topic': {
    iconURL: '/static/img/shapes/shape3.svg',
    title: 'Create a topic',
    description: 'Add custom topics to keep your discussions organized',
    ctaText: 'Create topic',
  },
  'make-group': {
    iconURL: '/static/img/shapes/shape4.svg',
    title: 'Make a group',
    description: 'Set user access permissions with custom parameters',
    ctaText: 'Make group',
  },
  'enable-integrations': {
    iconURL: '/static/img/shapes/shape5.svg',
    title: 'Enable integrations',
    description: 'Integrate your Discord, Snapshot, webhooks, etc.',
    ctaText: 'Integrate apps',
  },
  'create-thread': {
    iconURL: '/static/img/shapes/shape6.svg',
    title: 'Create a thread',
    description: 'Organize your discussions with topics',
    ctaText: 'Create thread',
  },
};

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
              <ActionCard
                ctaText={CARD_TYPES['launch-contest'].ctaText}
                title={CARD_TYPES['launch-contest'].title}
                description={CARD_TYPES['launch-contest'].description}
                iconURL={CARD_TYPES['launch-contest'].iconURL}
                iconAlt="launch-contest-icon"
                isActionCompleted={contestsData.length > 0}
                onCTAClick={() => redirectToPage('launch-contest')}
              />
            )}
            <ActionCard
              ctaText={CARD_TYPES['create-topic'].ctaText}
              title={CARD_TYPES['create-topic'].title}
              description={CARD_TYPES['create-topic'].description}
              iconURL={CARD_TYPES['create-topic'].iconURL}
              iconAlt="create-topic-icon"
              isActionCompleted={topics.length > 1} // we have a default 'General' topic which is not counted here
              onCTAClick={() => redirectToPage('create-topic')}
            />
            <ActionCard
              ctaText={CARD_TYPES['make-group'].ctaText}
              title={CARD_TYPES['make-group'].title}
              description={CARD_TYPES['make-group'].description}
              iconURL={CARD_TYPES['make-group'].iconURL}
              iconAlt="make-group-icon"
              isActionCompleted={groups.length > 0}
              onCTAClick={() => redirectToPage('create-group')}
            />
            <ActionCard
              ctaText={CARD_TYPES['enable-integrations'].ctaText}
              title={CARD_TYPES['enable-integrations'].title}
              description={CARD_TYPES['enable-integrations'].description}
              iconURL={CARD_TYPES['enable-integrations'].iconURL}
              iconAlt="enable-integrations-icon"
              isActionCompleted={hasAnyIntegration}
              onCTAClick={() => redirectToPage('manage-integrations')}
            />
            <ActionCard
              ctaText={CARD_TYPES['create-thread'].ctaText}
              title={CARD_TYPES['create-thread'].title}
              description={CARD_TYPES['create-thread'].description}
              iconURL={CARD_TYPES['create-thread'].iconURL}
              iconAlt="create-thread-icon"
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
