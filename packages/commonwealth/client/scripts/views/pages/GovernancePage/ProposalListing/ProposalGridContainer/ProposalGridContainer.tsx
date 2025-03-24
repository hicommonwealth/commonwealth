import React from 'react';

type ListContainerProps = React.HTMLProps<HTMLDivElement> & {
  children: React.ReactNode;
  style?: React.CSSProperties;
};

export const ProposalGridContainer = React.memo(
  React.forwardRef<HTMLDivElement, ListContainerProps>(
    ({ children, ...props }, ref) => (
      <div
        ref={ref}
        {...props}
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))',
          gap: '16px',
          padding: '16px',
        }}
      >
        {children}
      </div>
    ),
  ),
);
ProposalGridContainer.displayName = 'ProposalGridContainer';
