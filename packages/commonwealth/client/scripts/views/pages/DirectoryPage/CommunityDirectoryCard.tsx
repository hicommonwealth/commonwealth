import React from 'react';
import { useGetCommunityByIdQuery } from 'state/api/communities';
import useUserStore from 'state/ui/user';
import { CWText } from 'views/components/component_kit/cw_text';
import CWCircleMultiplySpinner from 'views/components/component_kit/new_designs/CWCircleMultiplySpinner';
import { CWRelatedCommunityCard } from 'views/components/component_kit/new_designs/CWRelatedCommunityCard';

interface CommunityDirectoryCardProps {
  communityId: string;
  threadsCount: number | string;
  membersCount: number | string;
}

const CommunityDirectoryCard = ({
  communityId,
  membersCount,
  threadsCount,
}: CommunityDirectoryCardProps) => {
  const user = useUserStore();

  const { data: community, isLoading: isCommunityLoading } =
    useGetCommunityByIdQuery({
      id: communityId,
      enabled: !!communityId,
      includeNodeInfo: true,
    });

  // allow user to buy stake if they have a connected address that matches active community base chain
  const canBuyStake = !!user.addresses.find?.(
    (address) => address?.community?.base === community?.base,
  );

  if (isCommunityLoading) return <CWCircleMultiplySpinner />;

  if (!community) return <CWText>Failed to load community</CWText>;

  return (
    <CWRelatedCommunityCard
      key={communityId}
      community={{
        id: community.id || '',
        name: community.name,
        base: community.base,
        description: community.description || '',
        iconUrl: community.icon_url || '',
        namespace: community.namespace || '',
        ChainNode: {
          url: community.ChainNode?.url || '',
          ethChainId: community.ChainNode?.eth_chain_id || 0,
        },
      }}
      canBuyStake={canBuyStake}
      memberCount={membersCount}
      threadCount={threadsCount}
    />
  );
};

export default CommunityDirectoryCard;
