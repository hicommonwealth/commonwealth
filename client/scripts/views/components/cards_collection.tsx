/* @jsx m */

import m from 'mithril';

import 'components/cards_collection.scss';

type CardsCollectionAttrs = {
  content: any[];
  header?: any;
};

export class CardsCollection implements m.ClassComponent<CardsCollectionAttrs> {
  view(vnode) {
    const { content, header } = vnode.attrs;
    return (
      <div class="CardsCollection">
        {!!header && <div class="header">{header}</div>}
        <div class="cards">{content}</div>
      </div>
    );
  }
}
