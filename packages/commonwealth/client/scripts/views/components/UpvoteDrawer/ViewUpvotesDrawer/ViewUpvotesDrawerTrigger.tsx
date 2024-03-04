import React from 'react';
import { CWThreadAction } from '../../component_kit/new_designs/cw_thread_action';

type ViewUpvotesDrawerTriggerProps = {
  onClick: (event: React.MouseEvent) => void;
};

export const ViewUpvotesDrawerTrigger = ({
  onClick,
}: ViewUpvotesDrawerTriggerProps) => {
  return (
    <CWThreadAction
      label="View upvotes"
      action="view-upvotes"
      onClick={onClick}
    />
  );
};
