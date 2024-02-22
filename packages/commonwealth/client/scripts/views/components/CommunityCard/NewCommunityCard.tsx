import React from 'react';
import { CWCard } from '../component_kit/cw_card';
import { CWText } from '../component_kit/cw_text';
import './NewCommunityCard.scss';

export const NewCommunityCard = () => {
  return (
    <CWCard
      elevation="elevation-2"
      interactive={true}
      className="new-community-card"
      onClick={(e) => {
        e.preventDefault();
        document.location = 'https://hicommonwealth.typeform.com/to/cRP27Rp5';
      }}
    >
      <div className="new-community-card-body">
        <CWText
          type="h3"
          fontWeight="semiBold"
          className="new-community-header"
        >
          Create a new community
        </CWText>
        <CWText className="new-community">
          Launch and grow your decentralized community on Commonwealth
        </CWText>
        <a className="learn-more" href="#">
          Learn more
        </a>
      </div>
    </CWCard>
  );
};
