import 'pages/link_new_address.scss';

import m from 'mithril';
import { Spinner } from 'construct-ui';
import app from 'state';

const LinkNewAddressPage: m.Component<{}> = {
  view: (vnode) => {
    if (app.modals.getList().length === 0) {
      m.route.set('/');
    }
    return m('.LinkNewAddressPage', [
      m(Spinner, { fill: true, size: 'xl', style: 'visibility: visible; opacity: 1;' }),
    ]);
  }
};

export default LinkNewAddressPage;
