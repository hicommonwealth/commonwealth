import 'pages/_listing_page.scss';

import { default as m } from 'mithril';
import app from 'state';

const ListingPage: m.Component<{ title?, subtitle?, content, sidebar?, class }> = {
  view: (vnode) => {
    return m('.ListingPage', {
      class: vnode.attrs.class
    }, [
      m('.page-container', [
        m('.container', [
          vnode.attrs.sidebar ? [
            m('.row', [
              m('.col-sm-9', vnode.attrs.content),
              m('.col-sm-3', vnode.attrs.sidebar),
            ])
          ] : vnode.attrs.content
        ])
      ]),
    ]);
  }
};

export default ListingPage;
