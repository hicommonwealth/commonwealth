import 'pages/loading.scss';

import { default as m } from 'mithril';
import ObjectPage from 'views/pages/_object_page';

const PageLoading: m.Component<{}> = {
  view: (vnode) => {
    return m(ObjectPage, {
      class: 'PageLoading',
      content: m('.loading-icon', [
        m('span.icon-spinner2.animate-spin')
      ]),
    });
  }
};

export default PageLoading;
