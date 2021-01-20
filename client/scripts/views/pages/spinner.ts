import 'pages/loading.scss';
import m from 'mithril';
import { Spinner } from 'construct-ui';

const SpinnerPage: m.Component<{ message?: string }> = {
  view: (vnode) => {
    const { message } = vnode.attrs;
    return m(Spinner, {
      fill: true,
      message,
      size: 'xl',
      style: 'visibility: visible; opacity: 1;'
    });
  }
};

export default SpinnerPage;
