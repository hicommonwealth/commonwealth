import 'components/listing_header.scss';

import m from 'mithril';
import app from 'state';

// title: boolean, replies: boolean, likes: boolean, activity: boolean

const ListingHeader : m.Component<{ columnHeaders: any[], showMenu?: boolean }> = {
  view: (vnode) => {
    const { columnHeaders, showMenu } = vnode.attrs;
    return m('.ListingHeader', [
      columnHeaders.map((column, idx) => {
        idx += 1;
        return m('.listing-header-col', {
          class: `listing-header-col-${idx}`
        }, column);
      }),
      app.isLoggedIn()
      && showMenu
      && m('.proposal-row-header-col.proposal-row-menu')
    ]);
  }
};

export default ListingHeader;
