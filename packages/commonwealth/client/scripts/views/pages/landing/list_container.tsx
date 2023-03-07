import React from 'react';

type ListContainerProps = {
  bgColor: string;
  margin: string;
} & React.PropsWithChildren;

export const ListContainer = (props: ListContainerProps) => {
  const { bgColor, margin } = props;

  return (
    <ul
      className={`rounded-3xl p-3 lg:p-6 relative min-h-tabs lg:flex
         lg:flex-col lg:h-full ${bgColor} ${margin}`}
    >
      {props.children}
    </ul>
  );
};
