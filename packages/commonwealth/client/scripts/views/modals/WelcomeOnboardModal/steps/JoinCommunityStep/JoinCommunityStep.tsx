import { ChainBase } from '@hicommonwealth/shared';
import ChainInfo from 'models/ChainInfo';
import React, { useEffect, useRef, useState } from 'react';
import { useFetchProfileByIdQuery } from 'state/api/profiles';
import useUserStore from 'state/ui/user';
import Permissions from 'utils/Permissions';
import useJoinCommunity from 'views/components/SublayoutHeader/useJoinCommunity';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWButton } from 'views/components/component_kit/new_designs/CWButton';
import { JoinCommunityCard } from './JoinCommunityCard';
import './JoinCommunityStep.scss';
import { findSuggestedCommunities } from './helpers';

type JoinCommunityStepProps = {
  onComplete: () => void;
};

const JoinCommunityStep = ({ onComplete }: JoinCommunityStepProps) => {
  const { linkSpecificAddressToSpecificCommunity } = useJoinCommunity();
  const [suggestedCommunities, setSuggestedCommunities] = useState<
    { community: ChainInfo; isJoined: boolean }[]
  >([]);
  const user = useUserStore();
  const userAddress = useRef(user.addresses?.[0]);
  const areCommunitiesSuggested = useRef(false);

  const { data: profile, isLoading: isLoadingProfile } =
    useFetchProfileByIdQuery({
      apiCallEnabled: true,
      shouldFetchSelfProfile: true,
    });

  useEffect(() => {
    if (!isLoadingProfile && profile && !areCommunitiesSuggested.current) {
      const suggestions = findSuggestedCommunities({
        maxCommunitiesToFind: 4,
        userChainBase: userAddress?.current?.community?.base as ChainBase,
        userPreferenceTags: (profile?.tags || []).map((t) => t.name),
      });
      setSuggestedCommunities(
        suggestions.map((chain) => ({
          community: chain,
          isJoined: Permissions.isCommunityMember(chain.id),
        })),
      );
      areCommunitiesSuggested.current = true;
    }
  }, [isLoadingProfile, profile]);

  const handleCommunityJoin = (community: ChainInfo) => {
    linkSpecificAddressToSpecificCommunity({
      address: userAddress?.current?.address,
      communityId: community?.id,
      communityChainBase: community?.base,
    })
      .then(() => {
        setSuggestedCommunities([
          ...suggestedCommunities.map((suggestion) => ({
            community: suggestion.community,
            isJoined:
              suggestion.community.id === community.id
                ? true
                : suggestion.isJoined,
          })),
        ]);
      })
      .catch(console.error);
  };

  return (
    <section className="JoinCommunityStep">
      <CWText type="h4" fontWeight="semiBold">
        Based on your interests we think you&apos;ll like...
      </CWText>
      <div className="communities-list">
        {suggestedCommunities.map(({ community, isJoined }, index) => (
          <JoinCommunityCard
            key={index + community.id + isJoined}
            community={community}
            onJoinClick={() => handleCommunityJoin(community)}
            isJoined={isJoined}
          />
        ))}
      </div>
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
