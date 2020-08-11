import 'components/listing.scss';

import m, { VnodeDOM, Vnode } from 'mithril';
import ListingHeader from '../components/listing_header';

interface IListingAttrs {
  content: any[];
  columnHeaders: any[];
  rightColSpacing: number[];
}

const Listing: m.Component<IListingAttrs> = {
  view: (vnode) => {
    const { columnHeaders, content, rightColSpacing } = vnode.attrs;
    return m('.Listing', [
      m(ListingHeader, { columnHeaders, rightColSpacing }),
      content
    ]);
  }
};

export default Listing;
