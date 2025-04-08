import { ExtendedCommunity } from '@hicommonwealth/schemas';
import React from 'react';
import useUserStore from 'state/ui/user';
import { CWRelatedCommunityCard } from 'views/components/component_kit/new_designs/CWRelatedCommunityCard';
import { z } from 'zod';
import { CommunityData } from './DirectoryPageContent'; // Import CommunityData type

interface CommunityDirectoryCardProps {
  communityData: CommunityData;
}

const CommunityDirectoryCard = ({
  communityData,
}: CommunityDirectoryCardProps) => {
  const user = useUserStore();

  // Simplified community object for CWRelatedCommunityCard
  const communityForCard = {
    id: communityData.id,
    name: communityData.name,
    namespace: communityData.namespace,
    icon_url: communityData.iconUrl,
    description: communityData.description,
    ChainNode: communityData.ChainNode, // Pass ChainNode through
    // Add other necessary fields if CWRelatedCommunityCard needs them,
    // mapping from communityData as required. Defaults/placeholders for now:
    base: communityData.ChainNode?.cosmosChainId
      ? 'cosmos'
      : communityData.ChainNode?.ethChainId
        ? 'ethereum'
        : undefined,
    last_30_day_thread_count: undefined, // Not available in CommunityData
    banner_url: undefined, // Not available in CommunityData
    directory_page_enabled: undefined, // Not available in CommunityData
    directory_page_chain_node_id: undefined, // Not available in CommunityData
    custom_domain: undefined, // Not available in CommunityData
    pinned_token: undefined, // Not available in CommunityData
    stake_enabled: undefined, // Not available in CommunityData
    has_groups: undefined, // Not available in CommunityData
    roles: undefined, // Not available in CommunityData
    chain_type: communityData.ChainNode?.cosmosChainId
      ? 'cosmos'
      : communityData.ChainNode?.ethChainId
        ? 'ethereum'
        : undefined,
  };

  // allow user to buy stake if they have a connected address that matches active community base chain
  // Use ChainNode from communityData to determine base
  const canBuyStake = !!user.addresses.find?.((address) => {
    const communityBase = communityData.ChainNode?.cosmosChainId
      ? 'cosmos'
      : communityData.ChainNode?.ethChainId
        ? 'ethereum'
        : undefined;
    return address?.community?.base === communityBase;
  });

  return (
    <CWRelatedCommunityCard
      key={communityData.id}
      // Cast is potentially unsafe, ensure CWRelatedCommunityCard handles potentially missing fields gracefully
      // or adjust the mapping above to provide all required fields.
      community={
        communityForCard as unknown as z.infer<typeof ExtendedCommunity>
      }
      canBuyStake={canBuyStake}
      memberCount={communityData.members}
      threadCount={communityData.threads}
    />
  );
};

export default CommunityDirectoryCard;
