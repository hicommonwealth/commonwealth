import 'components/row.scss';

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
  header: any;
}

const Listing: m.Component<IListingAttrs> = {
  view: (vnode) => {
    const { header, content } = vnode.attrs;
    return m('.Listing', [
      header,
      content
    ]);
  }
};

export default Listing;
