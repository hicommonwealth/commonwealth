import React from 'react';

export const ProposalGridItem: React.FC<React.HTMLAttributes<HTMLDivElement>> =
  React.memo(({ children, ...props }) => <div {...props}>{children}</div>);
