import 'pages/search.scss';

import m from 'mithril';
import _, { capitalize } from 'lodash';
import { Input } from 'construct-ui';

import app from 'state';
import { notifyError } from 'controllers/app/notifications';

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
  overridePrefix: boolean,
  errorText: string,
  focused: boolean,
}> = {
  view: (vnode) => {

    // if (m.route.param('q') && !vnode.state.searchModified) {
    //   vnode.state.searchTerm = m.route.param('q').toLowerCase();
    //   vnode.state.searchPrefix = SearchPrefix.COMMUNITY;
    // }
    const inCommunity = app.chain || app.community;

    // When user types in from: or in:, dropdown only shows options for completing those terms
    // When user types in both, shows options for both together

    const { fromPrefix, inPrefix, overridePrefix, focused, searchTerm } = vnode.state;
    // const contentLeft = (searchPref/ix?.length && !overridePrefix)
    // ? m('.search-prefix', searchPrefix) : null;
    const klass = vnode.state.focused ? '.SearchBar.focused' : '.SearchBar';

    return m(klass, [
      m(Input, {
        placeholder: 'Type to search...',
        autofocus: true,
        fluid: true,
        defaultValue: m.route.param('q'),
        oncreate: (e) => {
          if ((e.dom?.children[0] as HTMLInputElement)?.value) {
            vnode.state.searchTerm = (e.dom.children[0] as HTMLInputElement).value.toLowerCase();
          }
        },
        onclick: (e) => {
          vnode.state.focused = true;
          if (!overridePrefix && inCommunity) {
            vnode.state.inPrefix = inCommunity.id;
          }
        },
        // contentLeft,
        onkeyup: (e) => {
          if (e.target.value.includes('from:') && !fromPrefix) {
            //
          }
          if (e.key === 'Enter') {
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
      })
    ]);
  }
};

export default SearchBar;
