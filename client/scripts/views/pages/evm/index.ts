import 'pages/council.scss';

import m from 'mithril';
import mixpanel from 'mixpanel-browser';

import app from 'state';
import ListingPage from 'views/pages/_listing_page';
import PageLoading from 'views/pages/loading';
import { SubstrateAccount } from 'controllers/chain/substrate/account';
import { ChainBase } from '../../../models/models';
import SubstrateEVMContent from './substrate';
import SubstrateEVMSidebar from './substrate/sidebar';


const EVMPage: m.Component<{}> = {
  oncreate: () => {
    mixpanel.track('PageVisit', {
      'Page Name': 'EVMPage',
      'Scope': app.activeId(),
    });
  },
  view: (vnode) => {
    if (!app.chain || !app.vm.activeAccount) return m(PageLoading);
    const account = app.vm.activeAccount;
    let content, sidebar;
    if (app.chain.base === ChainBase.Substrate) {
      content = [ m(SubstrateEVMContent) ];
      sidebar = [ m(SubstrateEVMSidebar, { account: account as SubstrateAccount }) ];
    }

    return m(ListingPage, {
      class: 'EVMPage',
      title: 'EVM',
      subtitle: 'EVM stuff',
      content,
      sidebar,
    });
  },
};

export default EVMPage;
