import 'components/listing_header.scss';

import m from 'mithril';
import app from 'state';
import { ListingHeaderCols } from '../pages/listing';

// title: boolean, replies: boolean, likes: boolean, activity: boolean

const ListingHeader : m.Component<{ metadata: ListingHeaderCols[] }> = {
  view: (vnode) => {
    // const { title, replies, likes, activity } = vnode.attrs;
    return m('.ListingHeader', vnode.attrs.metadata.map((col, idx) => {
      idx += 1;
      switch (col) {
        case ListingHeaderCols.TITLE:
          return m('.listing-header-col', {
            class: `listing-header-col-${idx}`
          }, 'Title');
        case ListingHeaderCols.GALLERY:
          return m('.listing-header-col', {
            class: `listing-header-col-${idx}`
          }, 'Replies');
        case ListingHeaderCols.ACTIVITY:
          return m('.listing-header-col', {
            class: `listing-header-col-${idx}`
          }, 'Activity');
        case ListingHeaderCols.LIKES:
          return m('.listing-header-col', {
            class: `listing-header-col-${idx}`
          }, 'Likes');
        default:
          return null;
      }
    }));
    // app.isLoggedIn() && m('.listing-header-col.listing-menu'),
  }
};

export default ListingHeader;
