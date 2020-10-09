import 'pages/loading.scss';

import $ from 'jquery';
import m from 'mithril';
import { Spinner } from 'construct-ui';
import Sublayout from 'views/sublayout';

const LoadingPage: m.Component<{
  title?: string,
  message?: string,
  narrow?: boolean,
  showNewProposalButton?: boolean
}> = {
  view: (vnode) => {
    const { title, message, narrow, showNewProposalButton } = vnode.attrs;

    return m(Sublayout, {
      class: 'LoadingPage',
      title,
      showNewProposalButton,
      rightSidebar: narrow ? [] : null,
    }, [
      m(Spinner, {
        fill: true,
        message,
        size: 'xl',
        style: 'visibility: visible; opacity: 1;'
      }),
    ]);
  }
};

export default LoadingPage;
