import 'pages/404.scss';

import m from 'mithril';
import mixpanel from 'mixpanel-browser';
import { EmptyState, Icon, Icons } from 'construct-ui';
import Sublayout from 'views/sublayout';

const PageNotFound: m.Component<{ message?: string }> = {
  oncreate: (vnode) => {
    mixpanel.track('PageVisit', { 'Page Name': '404Page' });
  },
  view: (vnode) => {
    const { message } = vnode.attrs;
    return m(Sublayout, {
      class: 'PageNotFound',
      leftSidebar: null,
    }, [
      m(EmptyState, {
        class: 'PageNotFound',
        icon: Icons.X_OCTAGON,
        fill: false,
        header: 'The page you were looking for could not be found.',
        content: message || 'If it is not visible to the public, you may need to log in.'
      })
    ]);
  }
};

export default PageNotFound;
