import useTopicGating from 'client/scripts/hooks/useTopicGating';
import type Thread from 'client/scripts/models/Thread';
import app from 'client/scripts/state';
import useFetchProfilesByAddressesQuery from 'client/scripts/state/api/profiles/fetchProfilesByAddress';
import { useGetThreadPollsQuery } from 'client/scripts/state/api/threads';
import Permissions from 'client/scripts/utils/Permissions';
import { CWButton } from 'client/scripts/views/components/component_kit/new_designs/CWButton';
import React, { useMemo, useState } from 'react';
import useUserStore from 'state/ui/user';
import { ParticipationPromoCard } from '../ParticipationPromoCard';
import '../poll_cards.scss';
import { ThreadPollCard } from '../ThreadPollCard';
import { CreatePoll } from './CreatePoll';

export type PollCardProps = {
  thread: Thread;
};

type VoterProfileData = {
  address: string;
  name: string;
  avatarUrl?: string;
};

export const PollCard = ({ thread }: PollCardProps) => {
  const user = useUserStore();
  const communityId = app.activeChainId() || '';
  const [pollModalOpen, setPollModalOpen] = useState(false);

  const { data: pollsData = [] } = useGetThreadPollsQuery({
    threadId: +thread.id,
    apiCallEnabled: !!thread.id && !!communityId,
  });

  const uniqueVoterAddresses = useMemo(() => {
    if (pollsData && pollsData.length > 0) {
      const allAddresses = pollsData.flatMap((poll) =>
        (poll.votes || []).map((vote) => vote.address),
      );
      return Array.from(new Set(allAddresses));
    }
    return [];
  }, [pollsData]);

  const { data: fetchedProfiles, isLoading: isLoadingProfiles } =
    useFetchProfilesByAddressesQuery({
      currentChainId: communityId,
      profileChainIds: [communityId],
      profileAddresses: uniqueVoterAddresses,
      apiCallEnabled: !!communityId && uniqueVoterAddresses.length > 0,
    });

  const voterProfiles = useMemo(() => {
    if (!fetchedProfiles || fetchedProfiles.length === 0) {
      return {};
    }
    const profilesMap: Record<string, VoterProfileData> = {};
    fetchedProfiles.forEach((profile) => {
      if (profile.address) {
        profilesMap[profile.address] = {
          address: profile.address,
          name: profile.name || '',
          avatarUrl: profile.avatarUrl,
        };
      }
    });
    return profilesMap;
  }, [fetchedProfiles]);

  const { actionGroups, bypassGating } = useTopicGating({
    communityId,
    apiEnabled: !!user?.activeAccount?.address && !!communityId,
    userAddress: user?.activeAccount?.address || '',
    topicId: thread?.topic?.id || 0,
  });

  const isAdmin = Permissions.isSiteAdmin() || Permissions.isCommunityAdmin();
  const isAdminOrMod = isAdmin || Permissions.isCommunityModerator();
  const isAuthor = !!thread && Permissions.isThreadAuthor(thread);

  const showAdminPromo = isAdminOrMod && pollsData.length === 0;
  const showPollsSection =
    pollsData.length > 0 ||
    (!!isAuthor && (!app.chain?.meta?.admin_only_polling || isAdmin));

  const showAuthorPollCreate =
    showPollsSection &&
    isAuthor &&
    (!app.chain?.meta?.admin_only_polling || isAdmin) &&
    !showAdminPromo;

  const needsPollCreateModal = showAdminPromo || showAuthorPollCreate;

  if (!showAdminPromo && !showPollsSection) {
    return null;
  }

  return (
    <>
      {showAdminPromo && (
        <ParticipationPromoCard
          title="Poll"
          description="Add an off-chain poll so members can vote without leaving the thread."
          ctaLabel="Create poll"
          onCtaClick={() => setPollModalOpen(true)}
        />
      )}
      {showPollsSection && (
        <div className="cards-column">
          {[...new Map(pollsData?.map((poll) => [poll.id, poll])).values()].map(
            (poll) => (
              <ThreadPollCard
                thread={thread}
                poll={poll}
                key={poll.id}
                actionGroups={actionGroups}
                bypassGating={bypassGating}
                showDeleteButton={isAuthor || isAdmin}
                tokenDecimals={thread?.topic?.token_decimals ?? undefined}
                topicWeight={thread?.topic?.weighted_voting}
                voterProfiles={voterProfiles}
                isLoadingVotes={isLoadingProfiles}
              />
            ),
          )}
          {showAuthorPollCreate && (
            <div className="PollEditorCard">
              <CWButton
                buttonHeight="sm"
                className="create-poll-button"
                label={
                  pollsData.length > 0 ? 'Add another poll' : 'Create poll'
                }
                onClick={(e) => {
                  e.preventDefault();
                  setPollModalOpen(true);
                }}
              />
            </div>
          )}
        </div>
      )}
      {needsPollCreateModal && (
        <CreatePoll
          thread={thread}
          isOpen={pollModalOpen}
          onClose={() => setPollModalOpen(false)}
        />
      )}
    </>
  );
};
