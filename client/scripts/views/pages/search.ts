import 'pages/search.scss';

import m from 'mithril';
import _ from 'lodash';
import { Tag } from 'construct-ui';
import app from 'state';

import Sublayout from 'views/sublayout';
import PageLoading from 'views/pages/loading';
import Search from '../components/search';

const SEARCH_PAGE_SIZE = 50; // must be same as SQL limit specified in the database query

const SearchPage : m.Component<{}, {}> = {
  view: (vnode) => {
    if (!app.chain && !app.community) {
      return m(PageLoading, {
        narrow: true,
        showNewProposalButton: true,
        title: [
          'Search Discussions ',
          m(Tag, { size: 'xs', label: 'Beta', style: 'position: relative; top: -2px; margin-left: 6px' })
        ],
      });
    }

    return m(Sublayout, {
      class: 'SearchPage',
      title: [
        'Search Discussions ',
        m(Tag, { size: 'xs', label: 'Beta', style: 'position: relative; top: -2px; margin-left: 6px' })
      ],
      showNewProposalButton: true,
    }, m(Search));
  }
};

export default SearchPage;
