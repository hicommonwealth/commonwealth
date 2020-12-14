import 'pages/search.scss';

import $ from 'jquery';
import m from 'mithril';
import _ from 'lodash';
import moment from 'moment-twitter';
import { Input } from 'construct-ui';

import { link, pluralize } from 'helpers';
import app from 'state';

import { modelFromServer as threadModelFromServer } from 'controllers/server/threads';
import { modelFromServer as commentModelFromServer } from 'controllers/server/comments';
import Sublayout from 'views/sublayout';

const SEARCH_PAGE_SIZE = 20;
const SEARCH_DELAY = 750;

const SearchPage : m.Component<{}, { results }> = {
  view: (vnode) => {
    const onSearchInput = _.debounce(async (e) => {
      const searchTerm = e.target.value;
      if (!searchTerm || !searchTerm.toString().trim() || !searchTerm.match(/[A-Za-z]+/)) {
        return;
      }

      const chainId = app.activeChainId();
      const communityId = app.activeCommunityId();
      const params = {
        chain: chainId,
        community: communityId,
        cutoff_date: null, // cutoffDate.toISOString(),
        search: searchTerm,
        page_size: SEARCH_PAGE_SIZE,
      };
      const response = await $.get(`${app.serverUrl()}/search`, params);
      if (response.status !== 'Success') return;
      vnode.state.results = response.response;
      m.redraw();
    }, SEARCH_DELAY);

    return m(Sublayout, {
      class: 'ChatPage',
      title: 'Search',
      showNewProposalButton: true,
    }, [
      m(Input, {
        placeholder: 'Type to search...',
        autofocus: true,
        fluid: true,
        oninput: onSearchInput,
      }),
      vnode.state.results && m('.SearchResults', [
        m('.search-results-caption', [
          pluralize(vnode.state.results.length, 'result')
        ]),
        m('.search-results-list', [
          vnode.state.results.map((result) => {
            return result.title
              ? m('.search-results-item', [
                m('strong', 'Thread: '),
                m('.search-results-thread-title', result.title),
                m('.search-results-thread-body', result.body),
              ])
              : m('.search-results-item', [
                m('strong', 'Comment: '),
                m('.search-results-comment', result.text),
              ]);
          })
        ]),
      ]),
    ]);
  }
};

export default SearchPage;
