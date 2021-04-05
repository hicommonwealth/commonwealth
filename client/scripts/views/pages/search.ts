import 'pages/search.scss';

import m from 'mithril';
import _, { capitalize } from 'lodash';
import moment from 'moment-twitter';
import { Tabs, Spinner, TabItem, Tag, ListItem } from 'construct-ui';

import { link, pluralize } from 'helpers';
import { searchMentionableAddresses, searchDiscussions, searchChainsAndCommunities } from 'helpers/search';
import app from 'state';
import { AddressInfo, Profile } from 'models';

import QuillFormattedText from 'views/components/quill_formatted_text';
import MarkdownFormattedText from 'views/components/markdown_formatted_text';
import User, { UserBlock } from 'views/components/widgets/user';
import Sublayout from 'views/sublayout';
import PageLoading from 'views/pages/loading';
import getTokenLists from './home/token_lists';
import { CommunityLabel } from '../components/sidebar/community_selector';
import PageNotFound from './404';

const SEARCH_DELAY = 750;
const SEARCH_PAGE_SIZE = 50; // must be same as SQL limit specified in the database query

// TODO
const searchCache = {}; // only used to restore search results when returning to the page

export enum SearchType {
  Discussion = 'discussion',
  Community = 'community',
  Member = 'member',
  Top = 'top',
}

export enum ContentType {
  Thread = 'thread',
  Comment = 'comment',
  Community = 'community',
  Chain = 'chain',
  Token = 'token',
  Member = 'member'
}

export const search = async (searchTerm, communityScope, vnode) => {
  vnode.state.searchLoading = true;

  // if !communityScope search only...

  (async () => {
    try {
      await searchDiscussions(searchTerm, SEARCH_PAGE_SIZE).then((discussions) => {
        vnode.state.results = vnode.state.results.concat(discussions.map((discussion) => {
          discussion.contentType = discussion.root_id ? ContentType.Comment : ContentType.Thread;
          discussion.searchType = SearchType.Discussion;
          return discussion;
        }));
        m.redraw();
      });

      await searchMentionableAddresses(searchTerm, SEARCH_PAGE_SIZE, ['created_at', 'DESC']).then((addrs) => {
        vnode.state.results = vnode.state.results.concat(addrs.map((addr) => {
          addr.contentType = ContentType.Member;
          addr.searchType = SearchType.Member;
          return addr;
        }));
        m.redraw();
      });

      await getTokenLists().then((unfilteredTokens) => {
        const tokens = unfilteredTokens.filter((token) => token.name?.toLowerCase().includes(searchTerm));
        vnode.state.results = vnode.state.results.concat(tokens.map((token) => {
          token.contentType = ContentType.Token;
          token.searchType = SearchType.Community;
          return token;
        }));
      });

      await searchChainsAndCommunities(searchTerm, SEARCH_PAGE_SIZE).then((comms) => {
        vnode.state.results = vnode.state.results.concat(comms.map((commOrChain) => {
          commOrChain.contentType = commOrChain.created_at ? ContentType.Community : ContentType.Chain;
          commOrChain.searchType = SearchType.Community;
          return commOrChain;
        }));
      });

      console.log('loading over');
      vnode.state.searchLoading = false;
      vnode.state.errorText = null;
      m.redraw();
    } catch (err) {
      console.log('FETCHING ERROR');
      // TODO: Ensure error-catching operational
      vnode.state.searchLoading = false;
      vnode.state.errorText = err.responseJSON?.error || err.responseText || err.toString();
      m.redraw();
    }
  })();
};

// TODO: Linkification of users, tokens, comms results
const getMemberResult = (addr, searchTerm) => {
  const profile: Profile = app.profiles.getProfile(addr.chain, addr.address);
  return m('a.search-results-item', [
    m(UserBlock, {
      user: profile,
      linkify: true,
      searchTerm,
    })
  ]);
};

const getCommunityResult = (community) => {
  if (community.contentType === ContentType.Token) {
    // TODO: Linkification of tokens
    return link(
      'a.search-results-item',
      '#',
      [
        m('img', {
          src: community.logoURI,
          height: '15px',
          width: '15px'
        }),
        m('span', community.name)
      ]
    );
  } else if (community.contentType === ContentType.Chain
    || community.contentType === ContentType.Community) {
    return link(
      'a.search-results-item',
      community.id ? `/${community.id}` : '/',
      m(CommunityLabel, { community })
    );
  }
};

const getDiscussionResult = (thread, searchTerm) => {
  // TODO: Separate threads, proposals, and comments
  const activeId = app.activeId();
  const proposalId = thread.proposalid;
  return link('a.search-results-item',
    (thread.type === 'thread')
      ? `/${activeId}/proposal/discussion/${proposalId}`
      : `/${activeId}/proposal/${proposalId.split('_')[0]}/${proposalId.split('_')[1]}`,
    [
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

const getListing = (state: any, results: any, searchTerm: string, searchType?: SearchType) => {
  const filter = searchType === SearchType.Top ? null : searchType;
  const tabScopedResults = (filter ? results.filter((res) => res.searchType === searchType) : results)
    .sort((a, b) => {
      // TODO: Token-sorting approach
      // Some users are not verified; we give them a default date of 1900
      const aCreatedAt = moment(a.created_at || a.createdAt || a.verified || '1900-01-01T:00:00:00Z');
      const bCreatedAt = moment(b.created_at || b.createdAt || b.verified || '1900-01-01T:00:00:00Z');
      return bCreatedAt.diff(aCreatedAt);
    })
    .map((res) => {
      return res.searchType === SearchType.Discussion
        ? getDiscussionResult(res, searchTerm)
        : res.searchType === SearchType.Member
          ? getMemberResult(res, searchTerm)
          : res.searchType === SearchType.Community
            ? getCommunityResult(res)
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
        'Search ',
        m(Tag, { size: 'xs', label: 'Beta', style: 'position: relative; top: -2px; margin-left: 6px' })
      ],
    });

    const communityScope = m.route.param('scope');
    if (communityScope && (!app.chain && !app.community)) {
      return LoadingPage;
    }

    const searchTerm = m.route.param('q')?.toLowerCase();
    if (!searchTerm) {
      vnode.state.errorText = 'Must enter query to begin searching';
      return m(PageNotFound, {
        title: 'Search',
        message: 'Please enter query to begin searching'
      });
    }

    // re-fetch results for new search
    if (searchTerm !== vnode.state.searchTerm) {
      vnode.state.searchTerm = searchTerm;
      vnode.state.results = [];
      search(searchTerm, communityScope, vnode);
      return LoadingPage;
    }

    if (vnode.state.searchLoading) {
      return LoadingPage;
    } else if (!vnode.state.results && !vnode.state.errorText) {
      search(searchTerm, communityScope, vnode);
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

    const resultCount = vnode.state.activeTab === SearchType.Top
      ? tabScopedListing.length === SEARCH_PAGE_SIZE
        ? `${tabScopedListing.length}+ results`
        : pluralize(tabScopedListing.length, 'result')
      : tabScopedListing.length === SEARCH_PAGE_SIZE
        ? `${tabScopedListing.length}+ ${capitalize(vnode.state.activeTab)} results`
        : pluralize(tabScopedListing.length, `${capitalize(vnode.state.activeTab)} result`);

    return m(Sublayout, {
      class: 'SearchPage',
      title: [
        'Search ',
        m(Tag, { size: 'xs', label: 'Beta', style: 'position: relative; top: -2px; margin-left: 6px' })
      ],
      showNewProposalButton: true,
    }, m(Tabs, [
      m(TabItem, {
        label: 'Top',
        active: vnode.state.activeTab === SearchType.Top,
        onclick: () => {
          vnode.state.pageCount = 1;
          vnode.state.activeTab = SearchType.Top;
        },
      }),
      m(TabItem, {
        label: 'Communities',
        active: vnode.state.activeTab === SearchType.Community,
        onclick: () => {
          vnode.state.pageCount = 1;
          vnode.state.activeTab = SearchType.Community;
        },
      }),
      m(TabItem, {
        label: 'Discussion',
        active: vnode.state.activeTab === SearchType.Discussion,
        onclick: () => {
          vnode.state.pageCount = 1;
          vnode.state.activeTab = SearchType.Discussion;
        },
      }),
      m(TabItem, {
        label: 'Members',
        active: vnode.state.activeTab === SearchType.Member,
        onclick: () => {
          vnode.state.pageCount = 1;
          vnode.state.activeTab = SearchType.Member;
        },
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
          resultCount,
          ' for \'',
          vnode.state.searchTerm,
          '\'',
          vnode.state.activeTab === SearchType.Top
            && ` in ${capitalize(app.activeId())}`,
          capitalize(app.activeId())
            && [
              '. ',
              link(
                'a.search-all-communities',
                `/search?q=${searchTerm}`,
                'Search all communities?'
              )
            ]
        ]),
        m('.search-results-list', tabScopedListing),
      ]),
    ]));
  }
};

export default SearchPage;
