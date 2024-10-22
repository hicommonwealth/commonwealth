import { ChainBase, commonProtocol } from '@hicommonwealth/shared';
import shape1Url from 'assets/img/shapes/shape1.svg';
import shape3Url from 'assets/img/shapes/shape3.svg';
import shape4Url from 'assets/img/shapes/shape4.svg';
import shape5Url from 'assets/img/shapes/shape5.svg';
import shape6Url from 'assets/img/shapes/shape6.svg';
import { useCommonNavigate } from 'navigation/helpers';
import React, { useEffect, useState } from 'react';
import app from 'state';
import { useGetCommunityByIdQuery } from 'state/api/communities';
import { useFetchGroupsQuery } from 'state/api/groups';
import { useFetchThreadsQuery } from 'state/api/threads';
import { useFetchTopicsQuery } from 'state/api/topics';
import useAdminOnboardingSliderMutationStore from 'state/ui/adminOnboardingCards';
import Permissions from 'utils/Permissions';
import useCommunityContests from 'views/pages/CommunityManagement/Contests/useCommunityContests';
import { ActionCard, CardsSlider, DismissModal } from '../CardsSlider';
import { CWModal } from '../component_kit/new_designs/CWModal';

const CARD_TYPES = {
  'launch-contest': {
    iconURL: shape1Url,
    title: 'Launch a contest',
    description: 'Get your community engaged by launching a weekly contest',
    ctaText: 'Launch contest',
  },
  'create-topic': {
    iconURL: shape3Url,
    title: 'Create a topic',
    description: 'Add custom topics to keep your discussions organized',
    ctaText: 'Create topic',
  },
  'make-group': {
    iconURL: shape4Url,
    title: 'Make a group',
    description: 'Set user access permissions with custom parameters',
    ctaText: 'Make group',
  },
  'enable-integrations': {
    iconURL: shape5Url,
    title: 'Enable integrations',
    description: 'Integrate your Discord, Snapshot, webhooks, etc.',
    ctaText: 'Integrate apps',
  },
  'create-thread': {
    iconURL: shape6Url,
    title: 'Create a thread',
    description: 'Organize your discussions with topics',
    ctaText: 'Create thread',
  },
};

export const AdminOnboardingSlider = () => {
  const [isModalVisible, setIsModalVisible] = useState(false);

  const navigate = useCommonNavigate();

  const communityId = app.activeChainId() || '';
  const { data: community, isLoading: isLoadingCommunity } =
    useGetCommunityByIdQuery({
      id: communityId,
      enabled: !!communityId,
    });

  const integrations = {
    snapshot: (community?.snapshot_spaces || [])?.length > 0,
    discordBot: community?.discord_config_id !== null,
    discordBotWebhooksEnabled: community?.discord_bot_webhooks_enabled,
  };
  const hasAnyIntegration = !!(
    integrations.snapshot ||
    integrations.discordBot ||
    integrations.discordBotWebhooksEnabled
  );

  const {
    setIsVisible,
    shouldHideAdminCardsTemporary,
    shouldHideAdminCardsPermanently,
    setShouldHideAdminOnboardingCardsForCommunity,
  } = useAdminOnboardingSliderMutationStore();

  const { contestsData, isContestDataLoading } = useCommunityContests();

  const { data: topics = [], isLoading: isLoadingTopics = false } =
    useFetchTopicsQuery({
      communityId,
      apiEnabled: !!communityId,
    });

  const { data: groups = [], isLoading: isLoadingGroups = false } =
    useFetchGroupsQuery({
      communityId,
      enabled: !!communityId,
    });

  const { data: threadCount = 0, isLoading: isLoadingThreads = false } =
    useFetchThreadsQuery({
      communityId,
      queryType: 'count',
      limit: 1,
      apiEnabled: !!communityId,
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

  const isCommunitySupported =
    community?.base === ChainBase.Ethereum &&
    community?.ChainNode?.eth_chain_id &&
    [
      commonProtocol.ValidChains.Base,
      commonProtocol.ValidChains.SepoliaBase,
    ].includes(community?.ChainNode?.eth_chain_id);
  const isContestActionCompleted =
    isCommunitySupported && contestsData?.length > 0;

  const isSliderHidden =
    !communityId ||
    isLoadingCommunity ||
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
    ].includes(communityId);

  useEffect(() => {
    setIsVisible(!isSliderHidden);
  }, [isSliderHidden, setIsVisible]);

  if (isSliderHidden) {
    return;
  }

  return (
    <>
      <CardsSlider
        containerClassName="AdminOnboardingSliderPageLayout"
        className="AdminOnboardingSlider"
        headerText="Finish setting up your community"
        onDismiss={() => setIsModalVisible(true)}
      >
        {isCommunitySupported && (
          <ActionCard
            ctaText={CARD_TYPES['launch-contest'].ctaText}
            title={CARD_TYPES['launch-contest'].title}
            description={CARD_TYPES['launch-contest'].description}
            iconURL={CARD_TYPES['launch-contest'].iconURL}
            iconAlt="launch-contest-icon"
            isActionCompleted={contestsData?.length > 0}
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
      </CardsSlider>
      <CWModal
        size="small"
        visibleOverflow
        content={
          <DismissModal
            label="Setting up your community"
            description={`
              You can access all of these features from the admin capabilities
              section of the side panel in your community. We will remind you to
              complete these tasks next time you log in unless you select
              "Don't show this again."
            `}
            showDismissCheckbox={true}
            onModalClose={() => setIsModalVisible(false)}
            onDismiss={(shouldDismissPermanently) => {
              setIsModalVisible(false);
              setShouldHideAdminOnboardingCardsForCommunity(
                communityId,
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
