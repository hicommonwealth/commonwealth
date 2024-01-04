import { useCommonNavigate } from 'navigation/helpers';
import React, { useEffect, useState } from 'react';
import app from 'state';
import { useFetchGroupsQuery } from 'state/api/groups';
import { useFetchThreadsQuery } from 'state/api/threads';
import { useFetchTopicsQuery } from 'state/api/topics';
import useNewTopicModalMutationStore from 'state/ui/newTopicModal';
import Permissions from 'utils/Permissions';
import { CWText } from '../component_kit/cw_text';
import { CWButton } from '../component_kit/new_designs/cw_button';
import { AdminOnboardingCard } from './AdminOnboardingCard/AdminOnboardingCard';
import './AdminOnboardingSlider.scss';

export const AdminOnboardingSlider = () => {
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
  const [isVisible, setIsVisible] = useState(false);
  const { setIsNewTopicModalOpen } = useNewTopicModalMutationStore();
  const { data: topics = [], isLoading: isLoadingTopics = false } =
    useFetchTopicsQuery({
      communityId: app.activeChainId(),
    });
  const { data: groups = [], isLoading: isLoadingGroups = false } =
    useFetchGroupsQuery({
      communityId: app.activeChainId(),
    });
  const { data: threads = [], isLoading: isLoadingThreads = false } =
    useFetchThreadsQuery({
      chainId: app.activeChainId(),
      queryType: 'bulk',
      page: 1,
      limit: 20,
    });

  const redirectToPage = (
    pageName: 'create-group' | 'create-thread' | 'manage-community',
  ) => {
    pageName === 'create-group' && navigate(`/members/groups/create`);
    pageName === 'create-thread' && navigate(`/new/discussion`);
    pageName === 'manage-community' && navigate(`/manage`);
  };

  useEffect(() => {
    if (
      !isLoadingTopics &&
      !isLoadingGroups &&
      !isLoadingThreads &&
      (topics.length === 0 ||
        groups.length === 0 ||
        threads.length === 0 ||
        !hasAnyIntegration)
    ) {
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  }, [
    topics,
    isLoadingTopics,
    groups,
    isLoadingGroups,
    threads,
    isLoadingThreads,
    hasAnyIntegration,
  ]);

  if (
    !isVisible ||
    !(Permissions.isSiteAdmin() || Permissions.isCommunityAdmin())
  ) {
    return;
  }

  return (
    <section className="AdminOnboardingSlider">
      <div className="header">
        <CWText type="h4">Finish setting up your community</CWText>

        <CWButton
          containerClassName="dismissBtn"
          buttonType="tertiary"
          buttonWidth="narrow"
          onClick={() => setIsVisible(false)}
          label="Dismiss"
        />
      </div>
      <div className="cards">
        <AdminOnboardingCard
          cardType="create-topic"
          isActionCompleted={topics.length > 0}
          // TODO: after https://github.com/hicommonwealth/commonwealth/issues/6026,
          // redirect to specific section on the manage community page
          onCTAClick={() => setIsNewTopicModalOpen(true)}
        />
        <AdminOnboardingCard
          cardType="make-group"
          isActionCompleted={groups.length > 0}
          onCTAClick={() => redirectToPage('create-group')}
        />
        <AdminOnboardingCard
          cardType="enable-integrations"
          isActionCompleted={hasAnyIntegration}
          // TODO: after https://github.com/hicommonwealth/commonwealth/issues/6024,
          // redirect to specific section on the manage community page
          onCTAClick={() => redirectToPage('manage-community')}
        />
        <AdminOnboardingCard
          cardType="create-thread"
          isActionCompleted={threads.length > 0}
          onCTAClick={() => redirectToPage('create-thread')}
        />
      </div>
    </section>
  );
};
