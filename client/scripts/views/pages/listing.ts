import 'components/listing.scss';

import m, { VnodeDOM, Vnode } from 'mithril';
import ListingHeader from '../components/listing_header';

interface IListingAttrs {
  columnHeaders: any[];
  content: any[];
  rightColSpacing: number[];
  menuCarat?: boolean;
}

const Listing: m.Component<IListingAttrs> = {
  view: (vnode) => {
    const { columnHeaders, content, rightColSpacing, menuCarat } = vnode.attrs;
    return m('.Listing', [
      m(ListingHeader, { columnHeaders, rightColSpacing, showMenu: menuCarat }),
      content
    ]);
  }
};

export default Listing;
