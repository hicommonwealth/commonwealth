import 'pages/404.scss';

import { default as m } from 'mithril';
import { default as mixpanel } from 'mixpanel-browser';
import Sublayout from 'views/sublayout';

const PageNotFound: m.Component<{}> = {
  oncreate: (vnode) => {
    mixpanel.track('PageVisit', { 'Page Name': '404Page' });
  },
  view: (vnode) => {
    return m(Sublayout, {
      class: 'PageNotFound',
    }, [
      m('.home-header', [
        m('.container', [
          m('.row.row-narrow', [
            m('.col-sm-2.col-md-1', [
              m('h2', '404'),
            ]),
            m('.col-sm-10.col-md-11', [
              m('.info', [
                m('p', 'The page you were looking for could not be found. '),
                m('p', 'If it is not visible to the public, you may need to log in.'),
              ]),
            ]),
          ]),
        ]),
      ]),
    ]);
  }
};

export default PageNotFound;
