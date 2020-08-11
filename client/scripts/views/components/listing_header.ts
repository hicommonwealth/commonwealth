import 'components/listing_header.scss';

import m from 'mithril';
import app from 'state';
import { ListingHeaderCols } from '../pages/listing';

// title: boolean, replies: boolean, likes: boolean, activity: boolean

const ListingHeader : m.Component<{ metadata: ListingHeaderCols[] }> = {
  view: (vnode) => {
    return m('.ListingHeader', [
      vnode.attrs.metadata.map((colName, idx) => {
        idx += 1;
        switch (colName) {
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
            return m('.listing-header-col', {
              class: `listing-header-col-${idx}`
            }, colName);
        }
      }),
      app.isLoggedIn() && m('.proposal-row-header-col.proposal-row-menu')
    ]);
  }
};

export default ListingHeader;
