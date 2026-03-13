import React, { forwardRef } from 'react';
import { GridComponents } from 'react-virtuoso';

type ListContainerProps = React.HTMLProps<HTMLDivElement> & {
  children?: React.ReactNode;
  style?: React.CSSProperties;
};

const gridList = forwardRef<HTMLDivElement, ListContainerProps>(
  ({ children, ...props }, ref) => (
    <div ref={ref} {...props}>
      {children}
    </div>
  ),
);

gridList.displayName = 'DiscussionsVirtuosoGridList';

const gridItem = ({
  children,
  ...props
}: React.HTMLProps<HTMLDivElement> & {
  children?: React.ReactNode;
}) => <div {...props}>{children}</div>;

export const DISCUSSIONS_GRID_COMPONENTS: GridComponents = {
  Item: gridItem,
  List: gridList,
};
