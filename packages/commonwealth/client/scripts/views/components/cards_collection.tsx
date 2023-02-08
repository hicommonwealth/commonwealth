/* @jsx jsx */
import React from 'react';

import { ClassComponent, jsx } from 'mithrilInterop';
import type { ResultNode } from 'mithrilInterop';

import 'components/cards_collection.scss';

import { CWText } from './component_kit/cw_text';

type CardsCollectionAttrs = {
  content: Array<React.ReactNode> | React.ReactNode;
  header?: string;
};

export class CardsCollection extends ClassComponent<CardsCollectionAttrs> {
  view(vnode: ResultNode<CardsCollectionAttrs>) {
    const { content, header } = vnode.attrs;
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
  }
}
