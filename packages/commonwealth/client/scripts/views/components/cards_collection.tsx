import React from 'react';

import './cards_collection.scss';

import { CWText } from './component_kit/cw_text';

type CardsCollectionProps = {
  content: Array<React.ReactNode> | React.ReactNode;
  header?: string;
};

export const CardsCollection = (props: CardsCollectionProps) => {
  const { content, header } = props;

  return (
    <div className="CardsCollection">
      {!!header && (
        <CWText type="h3" fontWeight="semiBold">
          {header}
        </CWText>
      )}
      <div className="cards">{content}</div>
    </div>
  );
};
