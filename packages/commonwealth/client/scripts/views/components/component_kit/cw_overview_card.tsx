import React from 'react';

import 'components/component_kit/cw_overview_card.scss';

import { ComponentType } from './types';
import { CWText } from './cw_text';

type OverviewCardProps = {
  image: string;
  value: number;
  title: string;
};

export const CWOverviewCard = (props: OverviewCardProps) => {
  const { image, value, title } = props;

  return (
    <div className={ComponentType.OverviewCard}>
      <div className="top-row">
        <img src={image} />
        <CWText type="h2" fontWeight="bold">{value}</CWText>
      </div>
      <CWText type="b2" className="bottom-row-title">{title}</CWText>
    </div>
  );
};
