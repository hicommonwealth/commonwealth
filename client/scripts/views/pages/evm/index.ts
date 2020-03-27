import 'pages/council.scss';

import _ from 'lodash';
import m from 'mithril';
import mixpanel from 'mixpanel-browser';

import app from 'state';
import ListingPage from 'views/pages/_listing_page';
import PageLoading from 'views/pages/loading';

import AccountsWell from '../../components/settings/accounts_well';

const EVMPage: m.Component<{}> = {
  oncreate: () => {
    mixpanel.track('PageVisit', {
      'Page Name': 'EVMPage',
      'Scope': app.activeId(),
    });
  },
  view: () => {
    if (!app.chain) return m(PageLoading);
    return m(ListingPage, {
      class: 'EVMPage',
      title: 'EVM',
      subtitle: 'EVM stuff',
      content: [
        // eth stuff
      ],
      sidebar: [
        // stats
        m(AccountsWell, {
          addresses: app.login.activeAddresses,
          hasAction: false,
          isEVM: true,
        })
      ],
    });
  },
};

export default EVMPage;
