import 'components/row.scss';

import m, { VnodeDOM } from 'mithril';
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
  content: VnodeDOM[];
  columnLabels: ListingHeaderCols[]; // Ordered array of header labels, e.g. ['title', 'replies']
}

interface IContentLeft {
  header: VnodeDOM;
  subheader: VnodeDOM;
}

const Listing: m.Component<IListingAttrs> = {
  view: (vnode) => {
    const { content, columnLabels } = vnode.attrs;
    return m('.Listing', [
      m(ListingHeader, columnLabels),
      content
    ]);
  }
};

export default Listing;
