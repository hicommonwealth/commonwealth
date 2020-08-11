import 'components/listing_header.scss';

import m from 'mithril';
import app from 'state';
import { Grid, Col } from 'construct-ui';

// title: boolean, replies: boolean, likes: boolean, activity: boolean

const ListingHeader : m.Component<{ columnHeaders: any[], showMenu?: boolean, rightColSpacing: number[] }> = {
  view: (vnode) => {
    const { columnHeaders, showMenu, rightColSpacing } = vnode.attrs;
    const leftColumn = columnHeaders[0];
    const rightColumns = columnHeaders.slice(1);
    const initialOffset = 12 - rightColSpacing.reduce((t, n) => t + n);
    return m('.ListingHeader', [
      m('.listing-header-col', {
        class: `listing-header-col-${1}`
      }, leftColumn),
      m(Grid, { class: 'listing-header-right' }, [
        rightColumns.map((column, idx) => {
          return m(Col, {
            class: `listing-header-col listing-header-col-${idx + 2}`,
            span: rightColSpacing[idx],
            offset: initialOffset > 0 && idx === 0
              ? initialOffset
              : 0
          }, column);
        }),
        app.isLoggedIn()
        && showMenu
        && m('.proposal-row-header-col.proposal-row-menu')
      ])
    ]);
  }
};

export default ListingHeader;
