import React from 'react';
import { CWButton } from '../component_kit/new_designs/CWButton';

type CannotVoteProps = { label: string };

export const CannotVote = ({ label }: CannotVoteProps) => {
  return (
    <div className="CannotVote">
      <CWButton disabled label={label} />
    </div>
  );
};
