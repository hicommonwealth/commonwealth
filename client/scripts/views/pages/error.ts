import 'pages/error.scss';

import m from 'mithril';
import mixpanel from 'mixpanel-browser';
import { EmptyState, Icon, Icons } from 'construct-ui';
import Sublayout from 'views/sublayout';

const ErrorPage: m.Component<{ title?: string, message?: string }> = {
  oncreate: (vnode) => {
    mixpanel.track('PageVisit', { 'Page Name': 'ErrorPage' });
  },
  view: (vnode) => {
    const { message, title } = vnode.attrs;

    return m(Sublayout, {
      class: 'ErrorPage',
      title,
    }, [
      m(EmptyState, {
        class: 'ErrorPage',
        icon: Icons.ALERT_TRIANGLE,
        fill: false,
        header: 'Error',
        content: message || 'An error occurred while loading this page.'
      })
    ]);
  }
};

export default ErrorPage;
