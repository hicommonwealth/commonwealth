/* @jsx m */

import ClassComponent from 'class_component';

import 'components/cards_collection.scss';
import m from 'mithril';

import { CWText } from './component_kit/cw_text';

type CardsCollectionAttrs = {
  content: Array<m.Vnode> | m.Vnode;
  header?: string;
};

export class CardsCollection extends ClassComponent<CardsCollectionAttrs> {
  view(vnode: m.Vnode<CardsCollectionAttrs>) {
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
