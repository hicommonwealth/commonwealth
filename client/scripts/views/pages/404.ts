import 'pages/404.scss';

import { default as m } from 'mithril';
import { default as mixpanel } from 'mixpanel-browser';
import { EmptyState, Icon, Icons } from 'construct-ui';

const PageNotFound: m.Component<{}> = {
  oncreate: (vnode) => {
    mixpanel.track('PageVisit', { 'Page Name': '404Page' });
  },
  view: (vnode) => {
    return m(EmptyState, {
      class: '.PageNotFound',
      icon: Icons.X_OCTAGON,
      header: 'The page you were looking for could not be found.',
      content: 'If it is not visible to the public, you may need to log in.'
    });
  }
};

export default PageNotFound;
