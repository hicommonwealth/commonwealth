/* @jsx m */

import m from 'mithril';

import 'components/cards_collection.scss';

import { CWText } from './component_kit/cw_text';

type CardsCollectionAttrs = {
  content: any[];
  header?: any;
};

export class CardsCollection implements m.ClassComponent<CardsCollectionAttrs> {
  view(vnode) {
    const { content, header } = vnode.attrs;
    return (
      <div class="CardsCollection">
        {!!header && (
          <CWText type="h3" fontWeight="semiBold">
            {header}
          </CWText>
        )}
        <div class="cards">{content}</div>
      </div>
    );
  }
}
