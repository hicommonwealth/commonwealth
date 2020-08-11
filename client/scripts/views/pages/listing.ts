import 'components/listing.scss';

import m, { VnodeDOM, Vnode } from 'mithril';
import Chart from 'chart.js';
import moment from 'moment-twitter';

import app from 'state';
import ListingHeader from '../components/listing_header';

export enum ListingHeaderCols {
  TITLE = 'title',
  GALLERY = 'gallery',
  LIKES = 'likes',
  ACTIVITY = 'activity'
}

interface IListingAttrs {
  content: Vnode[];
  headerColumns: any;
}

const Listing: m.Component<IListingAttrs> = {
  view: (vnode) => {
    const { headerColumns, content } = vnode.attrs;
    return m('.Listing', [
      m(ListingHeader, { metadata: headerColumns }),
      content
    ]);
  }
};

export default Listing;
