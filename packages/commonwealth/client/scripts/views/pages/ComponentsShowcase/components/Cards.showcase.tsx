import React from 'react';
import app from 'state';
import { CWContentPageCard } from 'views/components/component_kit/CWContentPageCard';
import { CWCard } from 'views/components/component_kit/cw_card';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWRelatedCommunityCard } from 'views/components/component_kit/new_designs/CWRelatedCommunityCard';

const CardsShowcase = () => {
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
        community={app.config.chains.getAll()[30]}
        connected={false}
        memberCount={123}
        threadCount={456}
        stakeValue={78.91}
        stakeChange={-3.5}
      />
    </>
  );
};

export default CardsShowcase;
