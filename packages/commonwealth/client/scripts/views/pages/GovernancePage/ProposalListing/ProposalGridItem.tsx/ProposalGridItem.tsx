import React from 'react';

const ProposalGridItemComponent: React.FC<
  React.HTMLAttributes<HTMLDivElement>
> = ({ children, ...props }) => {
  return <div {...props}>{children}</div>;
};

ProposalGridItemComponent.displayName = 'ProposalGridItem';

export const ProposalGridItem = React.memo(ProposalGridItemComponent);
