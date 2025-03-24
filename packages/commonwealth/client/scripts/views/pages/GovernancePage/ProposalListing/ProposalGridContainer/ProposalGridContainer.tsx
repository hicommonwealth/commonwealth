/* eslint-disable react/prop-types */
import React from 'react';

type ListContainerProps = React.HTMLProps<HTMLDivElement> & {
  children: React.ReactNode;
  style?: React.CSSProperties;
};

const ProposalGridContainerComponent = React.forwardRef<
  HTMLDivElement,
  ListContainerProps
>(({ children, style, ...props }, ref) => (
  <div
    ref={ref}
    {...props}
    style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))',
      gap: '16px',
      padding: '16px',
      ...style,
    }}
  >
    {children}
  </div>
));

ProposalGridContainerComponent.displayName = 'ProposalGridContainer';

export const ProposalGridContainer = React.memo(ProposalGridContainerComponent);
