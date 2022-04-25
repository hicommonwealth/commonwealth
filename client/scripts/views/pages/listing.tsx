/* @jsx m */

import m from 'mithril';

import 'components/listing.scss';

import { isNotUndefined } from 'helpers/typeGuards';

type ListingAttrs = {
  columnHeader?: any;
  content: any[];
};

class Listing implements m.ClassComponent<ListingAttrs> {
  view(vnode) {
    const { columnHeader, content } = vnode.attrs;
    return (
      <div class="Listing">
        {isNotUndefined(columnHeader) && (
          <div class="ListingHeader">{columnHeader}</div>
        )}
        {content}
      </div>
    );
  }
}

export default Listing;
