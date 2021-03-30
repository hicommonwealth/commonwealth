import 'pages/search.scss';

import m from 'mithril';
import _ from 'lodash';
import { Input } from 'construct-ui';

import app from 'state';
import { notifyError } from 'controllers/app/notifications';

export enum SearchPrefix {
  COMMUNITY = 'comm:',
  MENTION = 'mention:',
  TOKEN = 'token:',
  USER = 'user:'
}

const SearchBar : m.Component<{}, {
  results: any[],
  searchLoading: boolean,
  searchTerm: string,
  searchModified: boolean,
  searchPrefix: string,
  overridePrefix: boolean,
  errorText: string,
  focused: boolean,
}> = {
  view: (vnode) => {
    if (!app.chain && !app.community) {
      return;
    }

    if (m.route.param('q') && !vnode.state.searchModified) {
      vnode.state.searchTerm = m.route.param('q').toLowerCase();
      vnode.state.searchPrefix = SearchPrefix.COMMUNITY;
    }

    const { searchPrefix, overridePrefix, focused, searchTerm } = vnode.state;
    const contentLeft = (searchPrefix?.length && !overridePrefix)
      ? m('.search-prefix', searchPrefix) : null;
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
          if (!overridePrefix) {
            vnode.state.searchPrefix = SearchPrefix.COMMUNITY;
          }
        },
        contentLeft,
        onkeyup: (e) => {
          if (e.key === 'Enter') {
            if (!searchTerm || !searchTerm.toString().trim() || !searchTerm.match(/[A-Za-z]+/)) {
              notifyError('Enter a valid search term');
              return;
            }
            vnode.state.searchModified = false;
            m.route.set(`/${app.activeId()}/search?q=${encodeURIComponent(vnode.state.searchTerm.toString().trim())}`);
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
