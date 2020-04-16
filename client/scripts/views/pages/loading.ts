import 'pages/loading.scss';

import { default as m } from 'mithril';
import { Spinner } from 'construct-ui';

import ObjectPage from 'views/pages/_object_page';

const PageLoading: m.Component<{}> = {
  view: (vnode) => {
    return m(ObjectPage, {
      class: 'PageLoading',
      content: m(Spinner, { fill: true, size: 'xl', style: 'visibility: visible; opacity: 1;' }),
    });
  }
};

export default PageLoading;
