import 'pages/search.scss';

import $ from 'jquery';
import m from 'mithril';
import _ from 'lodash';
import { Input } from 'construct-ui';

import app from 'state';
import { notifyError } from 'controllers/app/notifications';

export enum SearchPrefixes {
  COMMUNITY = 'comm:',
  MENTION = 'mention:',
  TOKEN = 'token:',
  USER = 'user:'
}

const SearchBar : m.Component<{}, {
  results: any[],
  searchLoading: boolean,
  searchTerm: string,
  searchPrefix: string,
  overridePrefix: boolean,
  errorText: string,
  focused: boolean,
}> = {
  view: (vnode) => {
    if (!app.chain && !app.community) {
      return;
    }

    const contentLeft = (vnode.state.searchPrefix?.length && !vnode.state.overridePrefix)
      ? m('.search-prefix', vnode.state.searchPrefix) : null;
    const klass = vnode.state.focused ? '.SearchBar.focused' : '.SearchBar';

    return m(klass, [
      m(Input, {
        placeholder: 'Type to search...',
        autofocus: true,
        fluid: true,
        defaultValue: m.route.param('q'),
        oncreate: (e) => {
          if ((e.dom?.children[0] as HTMLInputElement)?.value) {
            vnode.state.searchTerm = (e.dom.children[0] as HTMLInputElement).value;
          }
        },
        onclick: (e) => {
          vnode.state.focused = true;
          if (!vnode.state.overridePrefix) {
            vnode.state.searchPrefix = SearchPrefixes.COMMUNITY;
          }
        },
        contentLeft,
        onkeyup: (e) => {
          if (e.key === 'Enter') {
            const { searchTerm } = vnode.state;
            if (!searchTerm || !searchTerm.toString().trim() || !searchTerm.match(/[A-Za-z]+/)) {
              notifyError('Enter a valid search term');
              return;
            }
            m.route.set(`/${app.activeId()}/search?q=${encodeURIComponent(vnode.state.searchTerm.toString().trim())}`);
          }
        },
        oninput: (e) => {
          vnode.state.searchTerm = e.target.value;
        }
      })
    ]);
  }
};

export default SearchBar;
