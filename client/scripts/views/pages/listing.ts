import 'components/listing.scss';

import m, { VnodeDOM, Vnode } from 'mithril';
import Chart from 'chart.js';
import moment from 'moment-twitter';

import app from 'state';
import ListingHeader from '../components/listing_header';

interface IListingAttrs {
  content: any[];
  columnHeaders: any[];
}

const Listing: m.Component<IListingAttrs> = {
  view: (vnode) => {
    const { columnHeaders, content } = vnode.attrs;
    return m('.Listing', [
      m(ListingHeader, { columnHeaders }),
      content
    ]);
  }
};

export default Listing;
