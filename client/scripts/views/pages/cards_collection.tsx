/* @jsx m */

import m from 'mithril';

import 'components/cards_collection.scss';

import { isNotUndefined } from 'helpers/typeGuards';

type CardsCollectionAttrs = {
  header?: any;
  content: any[];
};

class CardsCollection implements m.ClassComponent<CardsCollectionAttrs> {
  view(vnode) {
    const { header, content } = vnode.attrs;
    return (
      <div class="CardsCollection">
        {isNotUndefined(header) && <div class="header">{header}</div>}
        <div class="cards">{content}</div>
      </div>
    );
  }
}

export default CardsCollection;
