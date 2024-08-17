import ChainInfo from 'models/ChainInfo';
import React from 'react';
import { useFetchProfileByIdQuery } from 'state/api/profiles';
import useUserStore from 'state/ui/user';
import Permissions from 'utils/Permissions';
import { trpc } from 'utils/trpcClient';
import useJoinCommunity from 'views/components/SublayoutHeader/useJoinCommunity';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWButton } from 'views/components/component_kit/new_designs/CWButton';
import CWCircleMultiplySpinner from 'views/components/component_kit/new_designs/CWCircleMultiplySpinner';
import { JoinCommunityCard } from './JoinCommunityCard';
import './JoinCommunityStep.scss';

type JoinCommunityStepProps = {
  onComplete: () => void;
};

const JoinCommunityStep = ({ onComplete }: JoinCommunityStepProps) => {
  const { linkSpecificAddressToSpecificCommunity } = useJoinCommunity();

  const user = useUserStore();
  const userAddress = user.addresses?.[0];

  const { data: profile, isLoading: isLoadingProfile } =
    useFetchProfileByIdQuery({
      apiCallEnabled: true,
      shouldFetchSelfProfile: true,
    });

  const profileTagIds = (profile?.tags || []).map((t) => t.id);
  const { data: suggestedCommunities, isLoading: isLoadingCommunities } =
    trpc.community.getCommunities.useQuery(
      {
        limit: 4,
        loose_filter: 'tag_ids',
        include_node_info: true,
        order_by: 'thread_count',
        order_direction: 'DESC',
        base: userAddress?.community?.base,
        tag_ids: profileTagIds.length > 0 ? profileTagIds.join(',') : undefined,
      },
      {
        staleTime: 60 * 3_000,
        enabled: !isLoadingProfile,
      },
    );

  const handleCommunityJoin = (community: Pick<ChainInfo, 'id' | 'base'>) => {
    linkSpecificAddressToSpecificCommunity({
      address: userAddress?.address,
      communityId: community?.id,
      communityChainBase: community?.base,
    }).catch(console.error);
  };

  return (
    <section className="JoinCommunityStep">
      <CWText type="h4" fontWeight="semiBold">
        Based on your interests we think you&apos;ll like...
      </CWText>
      {isLoadingCommunities ? (
        <CWCircleMultiplySpinner />
      ) : (
        <div className="communities-list">
          {suggestedCommunities?.results?.map((community, index) => {
            const isMember = Permissions.isCommunityMember(community.id);
            return (
              <JoinCommunityCard
                key={index + (community.id || '') + isMember}
                community={{
                  iconUrl: community.icon_url || '',
                  name: community.name || '',
                  profileCount: community.profile_count || 0,
                  threadCount: community.thread_count || 0,
                }}
                onJoinClick={() =>
                  handleCommunityJoin({
                    id: community.id || '',
                    base: community.base || '',
                  })
                }
                isJoined={isMember}
              />
            );
          })}
        </div>
      )}
      <CWButton
        label="Let's go!"
        buttonWidth="full"
        type="submit"
        onClick={onComplete}
      />
    </section>
  );
};

export { JoinCommunityStep };
