import React from 'react';
import { CWButton } from '../component_kit/cw_button';

type CannotVoteProps = { label: string };

export const CannotVote = ({ label }: CannotVoteProps) => {
  return (
    <div className="CannotVote">
      <CWButton disabled label={label} />
    </div>
  );
};
