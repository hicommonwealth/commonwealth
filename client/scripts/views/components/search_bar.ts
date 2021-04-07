import 'pages/search.scss';

import m from 'mithril';
import _, { capitalize } from 'lodash';
import { Input, ListItem, QueryList } from 'construct-ui';

import app from 'state';
import { notifyError } from 'controllers/app/notifications';
import { searchChainsAndCommunities } from 'helpers/search';

export enum SearchPrefix {
  COMMUNITY = 'in:',
  USER = 'from:'
}

const SearchBar : m.Component<{}, {
  results: any[],
  searchLoading: boolean,
  searchTerm: string,
  searchModified: boolean,
  fromPrefix: string,
  inPrefix: string,
  errorText: string,
  focused: boolean,
}> = {
  view: (vnode) => {
    if (!vnode.state.results) vnode.state.results = [];
    // if (m.route.param('q') && !vnode.state.searchModified) {
    //   vnode.state.searchTerm = m.route.param('q').toLowerCase();
    //   vnode.state.searchPrefix = SearchPrefix.COMMUNITY;
    // }
    const inCommunity = app.chain || app.community;

    // When user types in from: or in:, dropdown only shows options for completing those terms
    // When user types in both, shows options for both together

    const { fromPrefix, inPrefix, focused, searchTerm } = vnode.state;

    const klass = vnode.state.focused
      ? '.SearchBar.focused'
      : '.SearchBar';

    return m(klass, [
      m(QueryList, {
        inputAttrs: {
          placeholder: 'Type to search...',
          autofocus: true,
          fluid: true,
          defaultValue: m.route.param('q'),
          oncreate: (e) => {
            if ((e.dom?.children[0] as HTMLInputElement)?.value) {
              vnode.state.searchTerm = (e.dom.children[0] as HTMLInputElement).value.toLowerCase();
            }
          },
          onclick: async (e) => {
            vnode.state.focused = true;
            if (inCommunity) {
              vnode.state.inPrefix = inCommunity.id;
            } else if (!app.searchCache.communities) {
              app.searchCache['communities'] = await searchChainsAndCommunities();
            }
          },
          // contentLeft,
          onkeyup: async (e) => {
            // TODO: Combining prefixes, prefixes that do not come at start of search
            if (e.target.value === 'in:') {
              if (!app.searchCache.communities) {
                app.searchCache['communities'] = await searchChainsAndCommunities();
                vnode.state.results = app.searchCache.communities;
              }
            } else if (e.target.value === 'from:') {
              debugger
            } else if (e.key === 'Enter') {
              if (!searchTerm || !searchTerm.toString().trim() || !searchTerm.match(/[A-Za-z]+/)) {
                notifyError('Enter a valid search term');
                return;
              }
              if (searchTerm.length < 3) {
                notifyError('Query must be at least 3 characters');
              }
              // TODO: Consistent, in-advance sanitization of all params
              let params = `q=${encodeURIComponent(vnode.state.searchTerm.toString().trim())}`;
              if (inPrefix) params += `&in=${inPrefix}`;
              if (fromPrefix) params += `&from=${fromPrefix}`;
              vnode.state.searchModified = false;
              m.route.set(`/${app.activeId()}/search?q=${params}}`);
            }
          },
          oninput: (e) => {
            if (!vnode.state.searchModified) {
              vnode.state.searchModified = true;
            }
            vnode.state.searchTerm = e.target.value?.toLowerCase();
          }
        },
        items: vnode.state.results,
        itemRender: (item, idx) => {
          return m(ListItem, item)
        }
      })
    ]);
  }
};

export default SearchBar;
