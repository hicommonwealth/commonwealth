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
  header: string[]; // Ordered array of header labels, e.g. ['title', 'replies']
  metadata: VnodeDOM[] | string[];
  onclick: Function;
}

interface IContentLeft {
  header: VnodeDOM;
  subheader: VnodeDOM;
}

const Listing: m.Component<IListingAttrs> = {
  view: (vnode) => {
    m(ListingHeader, metadata);
  }
};

export default Row;
