import 'pages/loading.scss';

import $ from 'jquery';
import m from 'mithril';
import { Spinner } from 'construct-ui';
import Sublayout from 'views/sublayout';

const LoadingPage: m.Component<{ title?: string, message?: string }> = {
  // hack: prevent a smaller scrollHeight from resetting the previous page's scroll position
  oninit: (vnode) => {
    const h1 = $('html')[0].scrollHeight;
    $('html').css('min-height', h1);
  },
  onremove: (vnode) => {
    $('html').css('min-height', 'initial');
  },
  view: (vnode) => {
    const { title, message } = vnode.attrs;

    return m(Sublayout, {
      class: 'LoadingPage',
      title: title,
    }, [
      m(Spinner, {
        fill: true,
        message: message,
        size: 'xl',
        style: 'visibility: visible; opacity: 1;'
      }),
    ]);
  }
};

export default LoadingPage;
