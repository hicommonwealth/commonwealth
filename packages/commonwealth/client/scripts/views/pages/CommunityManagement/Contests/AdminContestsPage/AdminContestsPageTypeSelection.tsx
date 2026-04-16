import commonUrl from 'assets/img/branding/common.svg';
import farcasterUrl from 'assets/img/farcaster.svg';
import shape2Url from 'assets/img/shapes/shape2.svg';
import React from 'react';
import EmptyCard from 'views/pages/CommunityManagement/Contests/EmptyContestsList/EmptyCard';
import { ContestView } from '../types';
import type { AdminContestsPageData } from './useAdminContestsPageData';

type AdminContestsPageTypeSelectionProps = Pick<
  AdminContestsPageData,
  | 'community'
  | 'goToCreateTopicPage'
  | 'goToLaunchCommonContest'
  | 'goToLaunchFarcasterContest'
  | 'hasAtLeastOneWeightedVotingTopic'
  | 'judgeContestEnabled'
  | 'setContestView'
>;

const AdminContestsPageTypeSelection = ({
  community,
  goToCreateTopicPage,
  goToLaunchCommonContest,
  goToLaunchFarcasterContest,
  hasAtLeastOneWeightedVotingTopic,
  judgeContestEnabled,
  setContestView,
}: AdminContestsPageTypeSelectionProps) => {
  const canLaunchCommonContest =
    judgeContestEnabled || hasAtLeastOneWeightedVotingTopic;

  return (
    <div className="type-selection-list">
      {canLaunchCommonContest ? (
        <EmptyCard
          img={commonUrl}
          title="Launch on Common"
          subtitle={
            !community?.namespace
              ? `You need a namespace for your community to run Common contests. Set one up first.`
              : !hasAtLeastOneWeightedVotingTopic
                ? `You have a namespace, but no topics with weighted voting. You can still run a 
                      judged contest, but weighted topics are necessary for weighted voting contests.`
                : `Setting up a contest just takes a few minutes and can be a huge boost to your community.`
          }
          button={{
            label: community?.namespace
              ? 'Launch Common contest'
              : 'Create a namespace',
            handler: community?.namespace
              ? goToLaunchCommonContest
              : () => setContestView(ContestView.NamespaceEnablemenement),
          }}
        />
      ) : (
        <EmptyCard
          img={shape2Url}
          title="Launch on Common"
          subtitle={`You must have at least one topic with weighted voting enabled to run contest.
Setting up a contest just takes a few minutes and can be a huge boost to your community.`}
          button={{
            label: 'Create a topic',
            handler: goToCreateTopicPage,
          }}
        />
      )}

      <EmptyCard
        img={farcasterUrl}
        title="Launch on Farcaster"
        subtitle={
          community?.namespace
            ? `Share your contest on Farcaster`
            : `You need a namespace for your community to run Farcaster contests.
Set one up first.`
        }
        button={{
          label: community?.namespace
            ? 'Launch Farcaster contest'
            : 'Create a namespace',
          handler: community?.namespace
            ? goToLaunchFarcasterContest
            : () => setContestView(ContestView.NamespaceEnablemenement),
        }}
      />
    </div>
  );
};

export default AdminContestsPageTypeSelection;
