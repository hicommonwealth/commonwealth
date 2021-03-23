import 'pages/search.scss';

import $ from 'jquery';
import m from 'mithril';
import _ from 'lodash';
import moment from 'moment-twitter';
import { Input, Spinner, Tag } from 'construct-ui';

import { pluralize } from 'helpers';
import app from 'state';
import { AddressInfo } from 'models';

import QuillFormattedText from 'views/components/quill_formatted_text';
import MarkdownFormattedText from 'views/components/markdown_formatted_text';
import User from 'views/components/widgets/user';
import Sublayout from 'views/sublayout';
import PageLoading from 'views/pages/loading';

const SEARCH_DELAY = 750;
const SEARCH_RESULTS_SIZE = 10;

export enum SearchPrefixes {
  COMMUNITY = 'comm:',
  MENTION = 'mention:',
  TOKEN = 'token:',
  USER = 'user:'
}

const searchCache = {}; // only used to restore search results when returning to the page

export const search = _.debounce((searchTerm, vnode) => {
  vnode.state.searchTerm = searchTerm;

  const chainId = app.activeChainId();
  const communityId = app.activeCommunityId();
  const params = {
    chain: chainId,
    community: communityId,
    cutoff_date: null, // cutoffDate.toISOString(),
    search: searchTerm,
    results_size: SEARCH_RESULTS_SIZE,
  };
  $.get(`${app.serverUrl()}/search`, params).then((response) => {
    if (response.status !== 'Success') {
      vnode.state.searchLoading = false;
      m.redraw();
      return;
    }
    app.searchCache[searchTerm] = response.response;
    vnode.state.searchLoading = false;
    m.redraw();
  }).catch((err: any) => {
    vnode.state.searchLoading = false;
    vnode.state.errorText = err.responseJSON?.error || err.responseText || err.toString();
    m.redraw();
  });
}, SEARCH_DELAY);

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
            m.route.set(`/${app.activeId()}/search?q=${encodeURIComponent(vnode.state.searchTerm.toString().trim())}`);
          }
        },
        oninput: (e) => {
          vnode.state.searchTerm = e.target.value;
          const { searchTerm } = vnode.state;
          if (!searchTerm || !searchTerm.toString().trim() || !searchTerm.match(/[A-Za-z]+/)) {
            vnode.state.errorText = 'Enter a valid search term';
            vnode.state.searchLoading = false;
            return;
          }
          vnode.state.errorText = null;
          if (searchTerm.length < 3) {
            return;
          }
          vnode.state.searchLoading = true;
          search(e.target.value, vnode);
        }
      })
    ]);
  }
};

export default SearchBar;
