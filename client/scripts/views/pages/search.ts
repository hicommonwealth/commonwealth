import 'pages/search.scss';

import $ from 'jquery';
import m from 'mithril';
import _, { capitalize } from 'lodash';
import moment from 'moment-twitter';
import { Tabs, Spinner, TabItem, Tag } from 'construct-ui';

import { pluralize, searchMentionableAddresses, searchThreads } from 'helpers';
import app from 'state';
import { AddressInfo, Profile } from 'models';

import QuillFormattedText from 'views/components/quill_formatted_text';
import MarkdownFormattedText from 'views/components/markdown_formatted_text';
import User, { UserBlock } from 'views/components/widgets/user';
import Sublayout from 'views/sublayout';
import PageLoading from 'views/pages/loading';
import getTokenLists from './home/token_lists';

const SEARCH_DELAY = 750;
const SEARCH_PAGE_SIZE = 50; // must be same as SQL limit specified in the database query

const searchCache = {}; // only used to restore search results when returning to the page

export enum SearchType {
  Discussion = 'discussions',
  Community = 'communities',
  Member = 'members',
  Top = 'top',
}

export const search = _.debounce((searchTerm, vnode) => {
  vnode.state.searchLoading = true;

  searchThreads(searchTerm, SEARCH_PAGE_SIZE).then((threads) => {
    vnode.state.results = vnode.state.results.concat(threads.map((thread) => {
      thread.type = SearchType.Discussion;
      return thread;
    }));
    vnode.state.searchLoading = false;
    m.redraw();
  }).catch((err: any) => {
    vnode.state.searchLoading = false;
    vnode.state.errorText = err.responseJSON?.error || err.responseText || err.toString();
    m.redraw();
  });

  searchMentionableAddresses(searchTerm, SEARCH_PAGE_SIZE, ['created_at', 'DESC']).then((addrs) => {
    vnode.state.results = vnode.state.results.concat(addrs.map((addr) => {
      addr.type = SearchType.Member;
      return addr;
    }));
    vnode.state.searchLoading = false;
    m.redraw();
  }).catch((err: any) => {
    vnode.state.searchLoading = false;
    vnode.state.errorText = err.responseJSON?.error || err.responseText || err.toString();
    m.redraw();
  });

  getTokenLists().then((unfilteredTokens) => {
    const tokens = unfilteredTokens.filter((token) => token.name.includes(searchTerm));
    vnode.state.results = vnode.state.results.concat(tokens.map((token) => {
      debugger
      token.type = SearchType.Community;
      return token;
    }));
  });
}, SEARCH_DELAY);

const getUserResult = (addr, searchTerm) => {
  const profile: Profile = app.profiles.getProfile(addr.chain, addr.address);
  return m('a.search-results-item', [
    m(User, {
      user: profile,
      linkify: true,
    })
  ]);
};

const getTokenResult = (token) => {
  return m('a.search-results-item', [
    m('img', {
      src: token.logoURI,
      height: '15px',
      width: '15px'
    }),
    m('span', token.name)
  ]);
};

const getDiscussionResult = (thread, searchTerm) => {
  const activeId = app.activeId();
  const proposalType = thread.proposalType;
  const proposalId = thread.proposalid;
  return m('a.search-results-item', {
    href: (thread.type === 'thread')
      ? `/${activeId}/proposal/discussion/${proposalId}`
      : `/${activeId}/proposal/${proposalId.split('_')[0]}/${proposalId.split('_')[1]}`,
    onclick: (e) => {
      e.preventDefault();
      m.route.set(
        thread.type === 'thread'
          ? `/${activeId}/proposal/discussion/${proposalId}`
          : `/${activeId}/proposal/${proposalId.split('_')[0]}/${proposalId.split('_')[1]}`
      );
    }
  }, [
    thread.type === 'thread' ? [
      m('.search-results-thread-title', [
        decodeURIComponent(thread.title),
      ]),
      m('.search-results-thread-subtitle', [
        m('span.created-at', moment(thread.created_at).fromNow()),
        m(User, { user: new AddressInfo(thread.address_id, thread.address, thread.address_chain, null) }),
      ]),
      m('.search-results-thread-body', [
        (() => {
          try {
            const doc = JSON.parse(decodeURIComponent(thread.body));
            if (!doc.ops) throw new Error();
            return m(QuillFormattedText, {
              doc,
              hideFormatting: true,
              collapse: true,
              searchTerm,
            });
          } catch (e) {
            const doc = decodeURIComponent(thread.body);
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
        decodeURIComponent(thread.title),
      ]),
      m('.search-results-thread-subtitle', [
        m('span.created-at', moment(thread.created_at).fromNow()),
        m(User, { user: new AddressInfo(thread.address_id, thread.address, thread.address_chain, null) }),
      ]),
      m('.search-results-comment', [
        (() => {
          try {
            const doc = JSON.parse(decodeURIComponent(thread.body));
            if (!doc.ops) throw new Error();
            return m(QuillFormattedText, {
              doc,
              hideFormatting: true,
              collapse: true,
              searchTerm,
            });
          } catch (e) {
            const doc = decodeURIComponent(thread.body);
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
};

const getListing = (state: any, results: any, searchTerm: string, type?: SearchType) => {
  const filter = type === SearchType.Top ? null : type;
  const tabScopedResults = (filter ? results.filter((res) => res.type === type) : results)
    .sort((a, b) => {
      // TODO: Token-sorting approach
      // Some users are not verified; we give them a default date of 1900
      const aCreatedAt = moment(a.created_at || a.createdAt || a.verified || '1900-01-01T:00:00:00Z');
      const bCreatedAt = moment(b.created_at || b.createdAt || b.verified || '1900-01-01T:00:00:00Z');
      return bCreatedAt.diff(aCreatedAt);
    })
    .map((res) => {
      return res.type === SearchType.Discussion
        ? getDiscussionResult(res, searchTerm)
        : res.type === SearchType.Member
          ? getUserResult(res, searchTerm)
          : res.type === SearchType.Community
            ? getTokenResult(res)
            : null;
    })
    .slice(0, state.pageCount * 50);
  return tabScopedResults;
};

const SearchPage : m.Component<{
  results: any[]
}, {
  activeTab: SearchType,
  results: any[],
  searchLoading: boolean,
  searchTerm: string,
  searchPrefix: string,
  overridePrefix: boolean,
  pageCount: number,
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

    // re-fetch results for new search
    if (searchTerm !== vnode.state.searchTerm) {
      vnode.state.searchTerm = searchTerm;
      vnode.state.results = [];
      search(searchTerm, vnode);
      return LoadingPage;
    }

    if (vnode.state.searchLoading) {
      return LoadingPage;
    } else if (!vnode.state.results) {
      search(searchTerm, vnode);
      return;
    }

    if (!vnode.state.activeTab) {
      vnode.state.activeTab = SearchType.Top;
    }
    if (!vnode.state.pageCount) {
      vnode.state.pageCount = 1;
    }

    const tabScopedListing = getListing(
      vnode.state,
      vnode.state.results,
      vnode.state.searchTerm,
      vnode.state.activeTab
    );

    return m(Sublayout, {
      class: 'SearchPage',
      title: [
        'Search Discussions ',
        m(Tag, { size: 'xs', label: 'Beta', style: 'position: relative; top: -2px; margin-left: 6px' })
      ],
      showNewProposalButton: true,
    }, m(Tabs, [
      m(TabItem, {
        label: capitalize(SearchType.Top) || 'test',
        active: vnode.state.activeTab === SearchType.Top,
        onclick: () => { vnode.state.activeTab = SearchType.Top; },
      }),
      m(TabItem, {
        label: capitalize(SearchType.Community) || 'test',
        active: vnode.state.activeTab === SearchType.Community,
        onclick: () => { vnode.state.activeTab = SearchType.Community; },
      }),
      m(TabItem, {
        label: capitalize(SearchType.Discussion) || 'test',
        active: vnode.state.activeTab === SearchType.Discussion,
        onclick: () => { vnode.state.activeTab = SearchType.Discussion; },
      }),
      m(TabItem, {
        label: capitalize(SearchType.Member) || 'test',
        active: vnode.state.activeTab === SearchType.Member,
        onclick: () => { vnode.state.activeTab = SearchType.Member; },
      }),
    ]),
    m('.search-results', [
      vnode.state.searchLoading ? m('.search-loading', [
        m(Spinner, {
          active: true,
          fill: true,
          size: 'xl',
        }),
      ]) : vnode.state.errorText ? m('.search-error', [
        m('.error-text', vnode.state.errorText),
      ]) : m('.search-results', [
        m('.search-results-caption', [
          tabScopedListing.length === SEARCH_PAGE_SIZE
            ? `${tabScopedListing.length}+ results`
            : pluralize(tabScopedListing.length, 'result'),
          ' for \'',
          vnode.state.searchTerm,
          '\'',
          ' in ',
          vnode.state.activeTab === SearchType.Top
            ? capitalize(app.activeId())
            : capitalize(vnode.state.activeTab),
          m('a.search-results-clear', {
            href: '#',
            onclick: (e) => {
              e.preventDefault();
              e.stopPropagation();
              vnode.state.results = null;
            }
          }, 'Clear'),
        ]),
        m('.search-results-list', tabScopedListing),
      ]),
    ]));
  }
};

export default SearchPage;
