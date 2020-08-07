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
  contentLeft: IContentLeft;
  columnLabels: ListingHeaderCols[]; // Ordered array of header labels, e.g. ['title', 'replies']
  metadata: VnodeDOM[] | string[];
}

interface IContentLeft {
  header: VnodeDOM;
  subheader: VnodeDOM;
}

const Listing: m.Component<IListingAttrs> = {
  view: (vnode) => {
    const { contentLeft, columnLabels, metadata } = vnode.attrs;
    return m('.Listing', [
      m(ListingHeader, columnLabels),
    ]);
  }
};

export default Listing;
