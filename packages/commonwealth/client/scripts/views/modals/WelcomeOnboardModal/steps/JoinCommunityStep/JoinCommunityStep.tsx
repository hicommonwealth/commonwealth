import { ChainBase } from '@hicommonwealth/shared';
import React from 'react';
import { useFetchCommunitiesQuery } from 'state/api/communities';
import { useFetchProfileByIdQuery } from 'state/api/profiles';
import useUserStore from 'state/ui/user';
import Permissions from 'utils/Permissions';
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
    });

  const profileTagIds = (profile?.tags || [])
    .map((t) => t.id || 0)
    .filter((id) => id);

  const { data: communitiesList, isLoading: isLoadingCommunities } =
    useFetchCommunitiesQuery({
      limit: 4,
      relevance_by: 'tag_ids',
      include_node_info: true,
      order_by: 'lifetime_thread_count',
      order_direction: 'DESC',
      base: userAddress?.community?.base,
      cursor: 1,
      tag_ids: profileTagIds.length > 0 ? profileTagIds : [],
      enabled: !isLoadingProfile,
    });

  const suggestedCommunities = communitiesList?.pages?.[0].results || [];

  const handleCommunityJoin = (community: {
    id: string;
    base: ChainBase;
    iconUrl: string;
    name: string;
  }) => {
    if (!community) return;

    linkSpecificAddressToSpecificCommunity({
      address: userAddress?.address,
      community: {
        id: community.id,
        base: community.base,
        iconUrl: community.iconUrl,
        name: community.name,
      },
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
          {suggestedCommunities?.map((community, index) => {
            const isMember = Permissions.isCommunityMember(community.id);
            return (
              <JoinCommunityCard
                key={index + (community.id || '') + isMember}
                community={{
                  iconUrl: community.icon_url || '',
                  name: community.name || '',
                  profileCount: community.profile_count || 0,
                  lifetimeThreadCount: community.lifetime_thread_count || 0,
                }}
                onJoinClick={() =>
                  handleCommunityJoin({
                    id: community.id || '',
                    base: community.base || '',
                    iconUrl: community.icon_url || '',
                    name: community.name || '',
                  })
                }
                isJoined={isMember}
              />
            );
          })}
        </div>
      )}
      <div className="footer-container">
        <CWButton
          label="Let's go!"
          buttonWidth="full"
          type="submit"
          onClick={onComplete}
        />
      </div>
    </section>
  );
};

export { JoinCommunityStep };
