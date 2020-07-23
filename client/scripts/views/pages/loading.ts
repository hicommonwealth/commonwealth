import 'pages/loading.scss';

import $ from 'jquery';
import m from 'mithril';
import { Spinner } from 'construct-ui';
import Sublayout from 'views/sublayout';

const LoadingPage: m.Component<{ message?: string }> = {
  // hack: prevent a smaller scrollHeight from resetting the previous page's scroll position
  oninit: (vnode) => {
    const h1 = $('html')[0].scrollHeight;
    $('html').css('min-height', h1);
  },
  onremove: (vnode) => {
    $('html').css('min-height', 'initial');
  },
  view: (vnode) => {
    return m(Sublayout, {
      class: 'LoadingPage',
      leftSidebar: null,
    }, [
      m(Spinner, {
        fill: true,
        message: vnode.attrs.message,
        size: 'xl',
        style: 'visibility: visible; opacity: 1;'
      }),
    ]);
  }
};

export default LoadingPage;
