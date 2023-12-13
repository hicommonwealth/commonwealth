import React from 'react';
import { CWIcon } from '../../cw_icons/cw_icon';
import { ComponentType } from '../../types';

export const CWVoteWeightModule = () => {
  return (
    <div className={ComponentType.VoteWeightModule}>
      <div className="content">
        <div className="title-and-info">
          <div className="title">Hello, world</div>
          <CWIcon iconName="infoEmpty" />
        </div>
        <div className="vote-weight"></div>
        <div className="info"></div>
        <div className="actions"> </div>
      </div>
    </div>
  );
};
