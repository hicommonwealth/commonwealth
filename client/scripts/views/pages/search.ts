import 'pages/search.scss';

import $ from 'jquery';
import m from 'mithril';
import _, { capitalize } from 'lodash';
import moment from 'moment-twitter';
import { Input, Spinner, TabItem, Tag } from 'construct-ui';

import { pluralize, searchMentionableAddresses } from 'helpers';
import app from 'state';
import { AddressInfo, Profile } from 'models';

import QuillFormattedText from 'views/components/quill_formatted_text';
import MarkdownFormattedText from 'views/components/markdown_formatted_text';
import User, { UserBlock } from 'views/components/widgets/user';
import Sublayout from 'views/sublayout';
import PageLoading from 'views/pages/loading';
import Tabs from '../components/widgets/tabs';

const SEARCH_DELAY = 750;
const SEARCH_PAGE_SIZE = 50; // must be same as SQL limit specified in the database query

const searchCache = {}; // only used to restore search results when returning to the page

export const search = _.debounce((searchTerm, vnode?) => {
  app.searchCache[searchTerm] = {};

  const chainId = app.activeChainId();
  const communityId = app.activeCommunityId();
  const params = {
    chain: chainId,
    community: communityId,
    cutoff_date: null, // cutoffDate.toISOString(),
    search: searchTerm,
    results_size: SEARCH_PAGE_SIZE,
  };
  $.get(`${app.serverUrl()}/search`, params).then((response) => {
    if (response.status !== 'Success') {
      if (vnode) vnode.state.searchLoading = false;
      m.redraw();
      return;
    }
    app.searchCache[searchTerm]['discussion'] = response.result;
    if (vnode) vnode.state.searchLoading = false;
    m.redraw();
  }).catch((err: any) => {
    if (vnode) vnode.state.searchLoading = false;
    if (vnode) vnode.state.errorText = err.responseJSON?.error || err.responseText || err.toString();
    m.redraw();
  });
  searchMentionableAddresses(searchTerm, SEARCH_PAGE_SIZE).then((response) => {
    if (response.status !== 'Success') {
      if (vnode) vnode.state.searchLoading = false;
      m.redraw();
      return;
    }
    app.searchCache[searchTerm]['users'] = response.result;
    if (vnode) vnode.state.searchLoading = false;
    m.redraw();
  }).catch((err: any) => {
    if (vnode) vnode.state.searchLoading = false;
    if (vnode) vnode.state.errorText = err.responseJSON?.error || err.responseText || err.toString();
    m.redraw();
  });
}, SEARCH_DELAY);

const getUserListing = (users, searchTerm) => {
  return users.map((addr) => {
    const profile: Profile = app.profiles.getProfile(addr.chain, addr.address);
    return m('a.search-results-item', [
      m(User, {
        user: profile,
        linkify: true,
      })
    ]);
  });
};

const getDiscussionListing = (threads, searchTerm) => {
  return threads.map((result) => {
    const activeId = app.activeId();
    const proposalType = result.proposalType;
    const proposalId = result.proposalid;
    return m('a.search-results-item', {
      href: (result.type === 'thread')
        ? `/${activeId}/proposal/discussion/${proposalId}`
        : `/${activeId}/proposal/${proposalId.split('_')[0]}/${proposalId.split('_')[1]}`,
      onclick: (e) => {
        e.preventDefault();
        m.route.set(
          result.type === 'thread'
            ? `/${activeId}/proposal/discussion/${proposalId}`
            : `/${activeId}/proposal/${proposalId.split('_')[0]}/${proposalId.split('_')[1]}`
        );
      }
    }, [
      result.type === 'thread' ? [
        m('.search-results-thread-title', [
          decodeURIComponent(result.title),
        ]),
        m('.search-results-thread-subtitle', [
          m('span.created-at', moment(result.created_at).fromNow()),
          m(User, { user: new AddressInfo(result.address_id, result.address, result.address_chain, null) }),
        ]),
        m('.search-results-thread-body', [
          (() => {
            try {
              const doc = JSON.parse(decodeURIComponent(result.body));
              if (!doc.ops) throw new Error();
              return m(QuillFormattedText, {
                doc,
                hideFormatting: true,
                collapse: true,
                searchTerm,
              });
            } catch (e) {
              const doc = decodeURIComponent(result.body);
              return m(MarkdownFormattedText, {
                doc,
                hideFormatting: true,
                collapse: true,
                searchTerm,
              });
            }
          })(),
        ])
      ] : [
        m('.search-results-thread-title', [
          'Comment on ',
          decodeURIComponent(result.title),
        ]),
        m('.search-results-thread-subtitle', [
          m('span.created-at', moment(result.created_at).fromNow()),
          m(User, { user: new AddressInfo(result.address_id, result.address, result.address_chain, null) }),
        ]),
        m('.search-results-comment', [
          (() => {
            try {
              const doc = JSON.parse(decodeURIComponent(result.body));
              if (!doc.ops) throw new Error();
              return m(QuillFormattedText, {
                doc,
                hideFormatting: true,
                collapse: true,
                searchTerm,
              });
            } catch (e) {
              const doc = decodeURIComponent(result.body);
              return m(MarkdownFormattedText, {
                doc,
                hideFormatting: true,
                collapse: true,
                searchTerm,
              });
            }
          })(),
        ]),
      ]
    ]);
  });
}

export enum SearchTypes {
  DISCUSSION = 'discussions',
  COMMUNITY = 'communities',
  USER = 'users',
  TOKEN = 'tokens',
}

const SearchPage : m.Component<{
  results: any[]
}, {
  activeTab: SearchTypes,
  results: any[],
  searchLoading: boolean,
  searchTerm: string,
  searchPrefix: string,
  overridePrefix: boolean,
  errorText: string
}> = {
  view: (vnode) => {
    const LoadingPage = m(PageLoading, {
      narrow: true,
      showNewProposalButton: true,
      title: [
        'Search Discussions ',
        m(Tag, { size: 'xs', label: 'Beta', style: 'position: relative; top: -2px; margin-left: 6px' })
      ],
    });

    if (!app.chain && !app.community) {
      return LoadingPage;
    }

    const searchTerm = m.route.param('q');

    if (!app.searchCache[searchTerm]) {
      search(searchTerm, vnode);
    }

    if (app.searchCache[searchTerm]) {
      console.log(app.searchCache[searchTerm]);
      vnode.state.results = app.searchCache[searchTerm];
    } else {
      return LoadingPage;
    }

    // TODO: Add a Construct UI Tabs component for content types; use filtering
    // TODO: Sync up page result size, think through "all" results size vs type-sorted results size
    // (or re-querying)

    return m(Sublayout, {
      class: 'SearchPage',
      title: [
        'Search Discussions ',
        m(Tag, { size: 'xs', label: 'Beta', style: 'position: relative; top: -2px; margin-left: 6px' })
      ],
      showNewProposalButton: true,
    }, m(Tabs, [
      m(TabItem, {
        label: capitalize(SearchTypes.DISCUSSION),
        active: vnode.state.activeTab === SearchTypes.DISCUSSION,
        loading: false
      }, [
        vnode.state.searchLoading ? m('.search-loading', [
          m(Spinner, {
            active: true,
            fill: true,
            size: 'xl',
          }),
        ]) : vnode.state.errorText ? m('.search-error', [
          m('.error-text', vnode.state.errorText),
        ]) : !vnode.state.results ? m('.search-loading', [
          // TODO: prompt to start searching
        ]) : m('.search-results', [
          m('.search-results-caption', [
            vnode.state.results.length === SEARCH_PAGE_SIZE
              ? `${vnode.state.results.length}+ results`
              : pluralize(vnode.state.results.length, 'result'),
            ' for \'',
            vnode.state.searchTerm,
            '\'',
            m('a.search-results-clear', {
              href: '#',
              onclick: (e) => {
                e.preventDefault();
                e.stopPropagation();
                vnode.state.results = null;
                $('.search-page-input input').val('')
                  .select()
                  .focus();
              }
            }, 'Clear'),
          ]),
          m('.search-results-list', getDiscussionListing(
            vnode.state.results[SearchTypes.DISCUSSION], vnode.state.searchTerm
          )),
        ]),
      ]),
      m(TabItem, {
        label: capitalize(SearchTypes.USER),
        active: vnode.state.activeTab === SearchTypes.USER,
        loading: false
      }, [
        vnode.state.searchLoading ? m('.search-loading', [
          m(Spinner, {
            active: true,
            fill: true,
            size: 'xl',
          }),
        ]) : vnode.state.errorText ? m('.search-error', [
          m('.error-text', vnode.state.errorText),
        ]) : !vnode.state.results ? m('.search-loading', [
          // TODO: prompt to start searching
        ]) : m('.search-results', [
          m('.search-results-caption', [
            vnode.state.results.length === SEARCH_PAGE_SIZE
              ? `${vnode.state.results.length}+ results`
              : pluralize(vnode.state.results.length, 'result'),
            ' for \'',
            vnode.state.searchTerm,
            '\'',
            m('a.search-results-clear', {
              href: '#',
              onclick: (e) => {
                e.preventDefault();
                e.stopPropagation();
                vnode.state.results = null;
                $('.search-page-input input').val('')
                  .select()
                  .focus();
              }
            }, 'Clear'),
          ]),
          m('.search-results-list', getUserListing(
            vnode.state.results[SearchTypes.USER], vnode.state.searchTerm
          )),
        ]),
      ])
    ]));
  }
};

export default SearchPage;
