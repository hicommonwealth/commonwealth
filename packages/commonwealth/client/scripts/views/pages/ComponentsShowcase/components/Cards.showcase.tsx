import { ChainBase } from '@hicommonwealth/shared';
import React from 'react';
import { useGetCommunityByIdQuery } from 'state/api/communities';
import { CWContentPageCard } from 'views/components/component_kit/CWContentPageCard';
import { CWCard } from 'views/components/component_kit/cw_card';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWRelatedCommunityCard } from 'views/components/component_kit/new_designs/CWRelatedCommunityCard';

const CardsShowcase = () => {
  const sampleCommunityId = 'dydx';
  const { data: community } = useGetCommunityByIdQuery({
    id: sampleCommunityId,
    enabled: !!sampleCommunityId,
  });

  return (
    <>
      <CWText type="h5">Card</CWText>
      <div className="flex-row">
        <CWCard elevation="elevation-1" interactive>
          <CWText fontWeight="semiBold">Card title</CWText>
          <CWText>Elevation: 1</CWText>
        </CWCard>
        <CWCard elevation="elevation-2" interactive>
          <CWText fontWeight="semiBold">Card title</CWText>
          <CWText>Elevation: 2</CWText>
        </CWCard>
        <CWCard elevation="elevation-3" interactive>
          <CWText fontWeight="semiBold">Card title</CWText>
          <CWText>Elevation: 3</CWText>
        </CWCard>
      </div>

      <CWCard elevation="elevation-1" interactive fullWidth>
        <CWText fontWeight="semiBold">Card title</CWText>
        <CWText>Full width</CWText>
      </CWCard>

      <CWText type="h5">Content Page Card</CWText>
      <CWContentPageCard
        header="Information"
        content={<CWText className="content">Content page card content</CWText>}
      />

      <CWText type="h5">Related Community Card</CWText>
      <CWRelatedCommunityCard
        community={{
          id: community?.id || '',
          name: community?.name || '',
          base: (community?.base || '') as ChainBase,
          description: community?.description || '',
          iconUrl: community?.icon_url || '',
          ChainNode: {
            url: community?.ChainNode?.url || '',
            ethChainId: community?.ChainNode?.eth_chain_id || 0,
          },
          namespace: community?.namespace || '',
        }}
        memberCount="123"
        threadCount="456"
      />
    </>
  );
};

export default CardsShowcase;
