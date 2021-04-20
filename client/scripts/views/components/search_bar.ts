import 'pages/search.scss';

import m from 'mithril';
import _, { capitalize } from 'lodash';
import { ControlGroup, Input, List, ListItem, Spinner } from 'construct-ui';
import {
  searchMentionableAddresses,
  searchDiscussions,
  searchChainsAndCommunities,
} from 'helpers/search';
import getTokenLists from 'views/pages/home/token_lists';
import app from 'state';
import { notifyError } from 'controllers/app/notifications';
import { Profile, AddressInfo } from 'models';
import moment from 'moment';
import MarkdownFormattedText from './markdown_formatted_text';
import QuillFormattedText from './quill_formatted_text';
import { CommunityLabel } from './sidebar/community_selector';
import User, { UserBlock } from './widgets/user';
import { ALL_RESULTS_KEY } from '../pages/search';

export interface SearchParams {
  communityScope?: string;
  chainScope?: string;
  isSearchPreview?: boolean;
  resultSize?: number;
}

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

const SEARCH_PREVIEW_SIZE = 6;
const SEARCH_PAGE_SIZE = 50; // must be same as SQL limit specified in the database query

// TODO: Linkification of tokens, comms results
export const getMemberPreview = (addr, searchTerm, showChainName) => {
  console.log('getMemberPreview');
  const profile: Profile = app.profiles.getProfile(addr.chain, addr.address);
  const userLink = `/${m.route.param('scope') || addr.chain}/account/${addr.address}?base=${addr.chain}`;
  // TODO: Display longer or even full addresses
  return m(ListItem, {
    label: m('a.search-results-item', [
      m(UserBlock, {
        user: profile,
        searchTerm,
        avatarSize: 24,
        showAddressWithDisplayName: true,
        showFullAddress: true,
        showChainName,
      }),
    ]),
    onclick: (e) => {
      m.route.set(userLink);
    }
  });
};

export const getCommunityPreview = (community) => {
  console.log('getCommunityPreview');
  if (community.contentType === ContentType.Token) {
    return m(ListItem, {
      label: m('a.search-results-item', [
        m('img', {
          src: community.logoURI,
          height: '36px',
          width: '36px'
        }),
        m('span', community.name)
      ]),
      onclick: (e) => {
        // TODO: Linkification of tokens
        m.route.set('/');
      }
    });
  } else if (community.contentType === ContentType.Chain
    || community.contentType === ContentType.Community) {
    return m(ListItem, {
      label: m('a.search-results-item', [
        m(CommunityLabel, {
          community,
          size: 36,
        })
      ]),
      onclick: (e) => {
        m.route.set(community.id ? `/${community.id}` : '/');
      }
    });
  }
};

export const getDiscussionPreview = (thread, searchTerm) => {
  console.log('getDiscussionPreview');
  // TODO: Separate threads, proposals, and comments
  const activeId = app.activeId();
  const proposalId = thread.proposalid;
  return m(ListItem, {
    onclick: (e) => {
      m.route.set((thread.type === 'thread')
        ? `/${activeId}/proposal/discussion/${proposalId}`
        : `/${activeId}/proposal/${proposalId.split('_')[0]}/${proposalId.split('_')[1]}`);
    },
    label: m('a.search-results-item', [
      thread.type === 'thread' ? [
        m('.search-results-thread-title', [
          decodeURIComponent(thread.title),
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
    ]),
  });
};

const sortResults = (a, b) => {
  // TODO: Token-sorting approach
  // Some users are not verified; we give them a default date of 1900
  const aCreatedAt = moment(a.created_at || a.createdAt || a.verified || '1900-01-01T:00:00:00Z');
  const bCreatedAt = moment(b.created_at || b.createdAt || b.verified || '1900-01-01T:00:00:00Z');
  return bCreatedAt.diff(aCreatedAt);
};

const getBalancedContentListing = (unfilteredResults: any[], types: SearchType[]) => {
  console.log('getbalancedContentListing');
  const results = {};
  let unfilteredResultsLength = 0;
  for (const key of types) {
    results[key] = [];
    unfilteredResultsLength += (unfilteredResults[key]?.length || 0);
  }
  let priorityPosition = 0;
  let resultsLength = 0;
  while (resultsLength < 6 && resultsLength < unfilteredResultsLength) {
    for (let i = 0; i < types.length; i++) {
      const type = types[i];
      if (resultsLength < 6) {
        const nextResult = unfilteredResults[type][priorityPosition];
        if (nextResult) {
          results[type].push(nextResult);
          resultsLength += 1;
        }
      }
    }
    priorityPosition += 1;
  }
  return results;
};

const getResultsPreview = (searchTerm: string, communityScoped?) => {
  let results;
  let types;
  if (communityScoped) {
    types = [SearchType.Discussion, SearchType.Member];
    results = getBalancedContentListing(app.searchCache[searchTerm], types);
  } else {
    types = [SearchType.Discussion, SearchType.Member, SearchType.Community];
    results = getBalancedContentListing(app.searchCache[searchTerm], types);
  }
  const organizedResults = [];
  types.forEach((type) => {
    const res = results[type];
    if (res?.length === 0) return;
    const headerEle = m(ListItem, {
      label: `${capitalize(type)}s`,
      class: 'disabled',
      onclick: (e) => {
        e.preventDefault();
        e.stopPropagation();
      }
    });
    organizedResults.push(headerEle);
    (res as any[]).forEach((item) => {
      const resultRow = item.searchType === SearchType.Discussion
        ? getDiscussionPreview(item, searchTerm)
        : item.searchType === SearchType.Member
          ? getMemberPreview(item, searchTerm, !communityScoped)
          : item.searchType === SearchType.Community
            ? getCommunityPreview(item)
            : null;
      organizedResults.push(resultRow);
    });
  });
  return organizedResults;
};

const concludeSearch = (searchTerm: string, params: SearchParams, vnode, err?) => {
  app.searchCache[searchTerm].loaded = true;
  const commOrChainScoped = params.communityScope || params.chainScope;
  if (err) {
    vnode.state.results = {};
    vnode.state.errorText = (err.responseJSON?.error || err.responseText || err.toString());
  } else {
    vnode.state.results = params.isSearchPreview
      ? getResultsPreview(searchTerm, commOrChainScoped)
      : app.searchCache[searchTerm];
  }
  console.log('redrawing');
  m.redraw();
};

export const search = async (searchTerm: string, params: SearchParams, vnode) => {
  const { isSearchPreview, communityScope, chainScope } = params;
  const resultSize = isSearchPreview ? SEARCH_PREVIEW_SIZE : SEARCH_PAGE_SIZE;
  app.searchCache[searchTerm] = { loaded: false };

  // TODO: Simplify param passing, so consistent across calls, fns
  try {
    const [discussions, addrs] = await Promise.all([
      searchDiscussions(searchTerm, { resultSize, communityScope, chainScope }),
      searchMentionableAddresses(searchTerm, { resultSize, communityScope, chainScope }, ['created_at', 'DESC'])
    ]);

    app.searchCache[searchTerm][SearchType.Discussion] = discussions.map((discussion) => {
      discussion.contentType = discussion.root_id ? ContentType.Comment : ContentType.Thread;
      discussion.searchType = SearchType.Discussion;
      return discussion;
    }).sort(sortResults);

    app.searchCache[searchTerm][SearchType.Member] = addrs.map((addr) => {
      addr.contentType = ContentType.Member;
      addr.searchType = SearchType.Member;
      return addr;
    }).sort(sortResults);

    if (communityScope || chainScope) {
      concludeSearch(searchTerm, params, vnode);
      return;
    }

    const unfilteredTokens = app.searchCache[ALL_RESULTS_KEY]['tokens'];
    const tokens = unfilteredTokens.filter((token) => token.name?.toLowerCase().includes(searchTerm));
    console.log({ tokens });
    app.searchCache[searchTerm][SearchType.Community] = tokens.map((token) => {
      token.contentType = ContentType.Token;
      token.searchType = SearchType.Community;
      return token;
    });

    const allComms = app.searchCache[ALL_RESULTS_KEY]['communities'];
    app.searchCache[searchTerm][SearchType.Community] = app.searchCache[searchTerm][SearchType.Community]
      .concat(allComms.map((commOrChain) => {
        commOrChain.contentType = commOrChain.created_at ? ContentType.Community : ContentType.Chain;
        commOrChain.searchType = SearchType.Community;
        return commOrChain;
      })).sort(sortResults);

    concludeSearch(searchTerm, params, vnode);
  } catch (err) {
    concludeSearch(searchTerm, params, vnode, err);
  }
};

export const initializeSearch = async () => {
  // Pre-queries communities and tokens. Future searches merely filter from cached list,
  // to prevent unnecessary backend requests
  if (!app.searchCache[ALL_RESULTS_KEY]?.loaded) {
    app.searchCache[ALL_RESULTS_KEY] = {};
    try {
      const [tokens, comms] = await Promise.all([getTokenLists(), searchChainsAndCommunities()]);
      app.searchCache[ALL_RESULTS_KEY]['tokens'] = tokens;
      app.searchCache[ALL_RESULTS_KEY]['communities'] = comms;
    } catch (err) {
      app.searchCache[ALL_RESULTS_KEY]['tokens'] = [];
      app.searchCache[ALL_RESULTS_KEY]['communities'] = [];
    }
  }
};

const emptySearchPreview : m.Component<{ searchTerm: string }, {}> = {
  view: (vnode) => {
    const { searchTerm } = vnode.attrs;
    return m(ListItem, {
      class: 'no-results',
      label: [
        m('b', searchTerm),
        m('span', { style: 'white-space: pre;' }, '  •  '),
        m('span', 'Search community...')
      ],
      onclick: (e) => {
        if (searchTerm.length < 4) {
          notifyError('Query must be at least 4 characters');
        }
        // TODO: Consistent, in-advance sanitization of all params
        let params = `q=${encodeURIComponent(searchTerm.toString().trim())}`;
        if (app.activeCommunityId()) params += `&comm=${app.activeCommunityId()}`;
        else if (app.activeChainId()) params += `&chain=${app.activeChainId()}`;
        m.route.set(`/search?${params}`);
      }
    });
  }
};

const SearchBar : m.Component<{}, {
  results: any[],
  searchTerm: string,
  errorText: string,
  focused: boolean,
}> = {
  view: (vnode) => {
    if (!vnode.state.searchTerm) vnode.state.searchTerm = '';

    const { results, searchTerm } = vnode.state;
    const searchResults = (results?.length === 0)
      ? (app.searchCache[searchTerm].loaded || searchTerm.length > 5)
        ? m(List, [ m(emptySearchPreview, { searchTerm }) ])
        : m(List, m(ListItem, { label: m(Spinner, { active: true }) }))
      : m(List, results);

    return m(ControlGroup, {
      class: vnode.state.focused ? 'SearchBar focused' : 'SearchBar'
    }, [
      m(Input, {
        placeholder: 'Type to search...',
        autofocus: true,
        fluid: true,
        // TODO: param term not populating input
        defaultValue: m.route.param('q') || vnode.state.searchTerm,
        value: vnode.state.searchTerm,
        oncreate: (e) => {
          if ((e.dom?.children[0] as HTMLInputElement)?.value) {
            vnode.state.searchTerm = (e.dom.children[0] as HTMLInputElement).value.toLowerCase();
          }
          initializeSearch();
        },
        onclick: async (e) => {
          vnode.state.focused = true;
        },
        oninput: (e) => {
          e.stopPropagation();
          vnode.state.searchTerm = e.target.value?.toLowerCase();
          if (e.target.value?.length > 3) {
            const params: SearchParams = {};
            params['isSearchPreview'] = true;
            params['communityScope'] = app.activeCommunityId();
            params['chainScope'] = app.activeChainId();
            _.debounce(() => search(vnode.state.searchTerm, params, vnode), 200)();
          }
        },
        onkeyup: (e) => {
          e.stopPropagation();
          if (e.key === 'Enter') {
            if (!searchTerm || !searchTerm.toString().trim() || !searchTerm.match(/[A-Za-z]+/)) {
              notifyError('Enter a valid search term');
              return;
            }
            if (searchTerm.length < 4) {
              notifyError('Query must be at least 4 characters');
            }
            let params = `q=${encodeURIComponent(vnode.state.searchTerm.toString().trim())}`;
            if (app.activeCommunityId()) params += `&comm=${app.activeCommunityId()}`;
            else if (app.activeChainId()) params += `&chain=${app.activeChainId()}`;
            m.route.set(`/search?${params}`);
          }
        },
      }),
      // TODO: Addrs are showing twice
      searchTerm.length > 3
      && searchResults
    ]);
  }
};

export default SearchBar;
