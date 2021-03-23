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
const SEARCH_PAGE_SIZE = 10;

export enum SearchPrefixes {
  COMMUNITY = 'comm;',
  MENTION = 'mention;',
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
    page_size: SEARCH_PAGE_SIZE,
  };
  $.get(`${app.serverUrl()}/search`, params).then((response) => {
    if (response.status !== 'Success') {
      vnode.state.searchLoading = false;
      m.redraw();
      return;
    }
    vnode.state.results = response.response;
    searchCache[searchTerm] = response.response;
    vnode.state.searchLoading = false;
    m.redraw();
  }).catch((err: any) => {
    vnode.state.searchLoading = false;
    vnode.state.errorText = err.responseJSON?.error || err.responseText || err.toString();
    m.redraw();
  });
}, SEARCH_DELAY);

const SearchBar : m.Component<{}, {
  results,
  searchLoading: boolean,
  searchTerm: string,
  searchPrefix: string,
  overridePrefix: boolean,
  errorText: string
}> = {
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

    return m(Input, {
      placeholder: 'Type to search...',
      autofocus: true,
      fluid: true,
      class: 'search-page-input',
      defaultValue: m.route.param('q'),
      onclick: (e) => {
        if (!vnode.state.overridePrefix) {
          vnode.state.searchPrefix = SearchPrefixes.COMMUNITY;
        }
      },
      contentLeft: vnode.state.searchPrefix?.length
        && !vnode.state.overridePrefix
        && m('span.search-prefix', vnode.state.searchPrefix),
      oncreate: (vvnode) => {
        console.log('created');
        const $input = $(vvnode.dom).find('input').focus();
        // wait for defaultValue to be applied, then try to load the search request for ?q=
        setTimeout(() => {
          if ($input.val() !== '' && $input.val().toString().length >= 3) {
            const searchTerm = $input.val().toString();
            if (searchCache[searchTerm]) {
              vnode.state.results = searchCache[searchTerm];
              vnode.state.searchLoading = false;
              vnode.state.searchTerm = searchTerm;
              m.redraw();
            } else {
              search(searchTerm, vnode);
            }
          }
        }, 0);
      },
      oninput: (e) => {
        const searchTerm = e.target.value;
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
        m.route.set(`/${app.activeId()}/search?q=${encodeURIComponent(searchTerm.toString().trim())}`);
      }
    });
  }
};

export default SearchBar;
