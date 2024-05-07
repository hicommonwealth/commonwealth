import { ChainNetwork } from '@hicommonwealth/shared';
import ChainInfo from 'client/scripts/models/ChainInfo';
import app from 'client/scripts/state';
import Permissions from 'client/scripts/utils/Permissions';
import useJoinCommunity from 'client/scripts/views/components/SublayoutHeader/useJoinCommunity';
import React, { useEffect, useRef, useState } from 'react';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWButton } from 'views/components/component_kit/new_designs/CWButton';
import { JoinCommunityCard } from './JoinCommunityCard';
import './JoinCommunityStep.scss';

type JoinCommunityStepProps = {
  onComplete: () => void;
};

const JoinCommunityStep = ({ onComplete }: JoinCommunityStepProps) => {
  const { linkSpecificAddressToSpecificCommunity } = useJoinCommunity();
  const [suggestedCommunities, setSuggestedCommunities] = useState<
    { community: ChainInfo; isJoined: boolean }[]
  >([]);
  const userAddress = useRef(app?.user?.addresses?.[0]);

  useEffect(() => {
    const userChainNetwork = userAddress?.current?.profile
      ?.chain as ChainNetwork;

    // get 4 suggested communities based on the user's selected wallet
    const chains = [...app.config.chains.getAll()]
      .filter((chain) => chain.network === userChainNetwork)
      .sort((a, b) => b.addressCount - a.addressCount)
      .sort((a, b) => b.threadCount - a.threadCount)
      .slice(0, 4);

    setSuggestedCommunities(
      chains.map((chain) => ({
        community: chain,
        isJoined: Permissions.isCommunityMember(chain.id),
      })),
    );
  }, []);

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
