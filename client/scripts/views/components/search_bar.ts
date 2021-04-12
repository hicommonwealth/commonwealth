import 'pages/search.scss';

import m from 'mithril';
import _, { capitalize } from 'lodash';
import { ControlGroup, Input, List, ListItem } from 'construct-ui';
import {
  searchMentionableAddresses,
  searchDiscussions,
  searchChainsAndCommunities,
  CommunityIcon,
  DiscussionIcon,
  MemberIcon,
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

export enum SearchPrefix {
  COMMUNITY = 'in:',
  USER = 'from:'
}

interface SearchParams {
  communityScope?: string;
  memberScope?: string;
  isSearchPreview?: boolean;
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

const SEARCH_PREVIEW_SIZE = 5;
const SEARCH_PAGE_SIZE = 50; // must be same as SQL limit specified in the database query

// TODO: Linkification of users, tokens, comms results
export const getMemberPreview = (addr, searchTerm) => {
  const profile: Profile = app.profiles.getProfile(addr.chain, addr.address);
  const userLink = `/${m.route.param('scope') || addr.chain}/account/${addr.address}?base=${addr.chain}`;
  // TODO: Display longer or even full addresses
  return m(ListItem, {
    label: m('a.search-results-item', [
      // TODO: Add searchTerm support that's present in UserBlock
      m(User, {
        user: profile,
        // searchTerm,
        avatarSize: 17,
        showAddressWithDisplayName: true,
      }),
    ]),
    onclick: (e) => {
      m.route.set(userLink);
    }
  });
};

export const getCommunityPreview = (community) => {
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

const getContentTypeOrdering = (content: any) => {
  let type;
  switch (content.contentType) {
    case ContentType.Thread:
      type = 1;
      break;
    case ContentType.Comment:
      type = 2;
      break;
    case ContentType.Community:
      type = 3;
      break;
    case ContentType.Token:
      type = 4;
      break;
    case ContentType.Member:
      type = 5;
      break;
    default:
      type = 6;
      break;
  }
  return type;
};

const sortResults = (a, b) => {
  // TODO: Token-sorting approach
  // Some users are not verified; we give them a default date of 1900
  const aCreatedAt = moment(a.created_at || a.createdAt || a.verified || '1900-01-01T:00:00:00Z');
  const bCreatedAt = moment(b.created_at || b.createdAt || b.verified || '1900-01-01T:00:00:00Z');
  return bCreatedAt.diff(aCreatedAt);
};

const getResultsPreview = (searchTerm, communityScoped?) => {
  const results = {};
  const a = app;
  const memberResults = app.searchCache[SearchType.Member].sort(sortResults);
  const discussionResults = app.searchCache[SearchType.Discussion].sort(sortResults);
  debugger
  if (communityScoped) {
    console.log({ members: memberResults });
    results[SearchType.Member] = memberResults.slice(0, 3);
    console.log({ discussions: discussionResults });
    results[SearchType.Discussion] = discussionResults.slice(0, 6 - results[SearchType.Member].length);
    // If discussions do not "fill" the 6-result quota, more than 3 users can be displayed
    if (discussionResults.length < 3) {
      results[SearchType.Member] = results[SearchType.Member]
        .concat(memberResults.slice(2, 6 - discussionResults.length));
    }
  }
  const organizedResults = [];
  Object.entries(results).forEach((pair) => {
    const [type, res] = pair;
    if ((res as any).length === 0) return;
    console.log({ type, res });
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
          ? getMemberPreview(item, searchTerm)
          : item.searchType === SearchType.Community
            ? getCommunityPreview(item)
            : null;
      organizedResults.push(resultRow);
    });
  });
  return organizedResults;
};

export const search = async (searchTerm: string, params: SearchParams, vnode) => {
  vnode.state.searchLoading = true;
  // TODO: Hookup community and member scope
  const { communityScope, memberScope, isSearchPreview } = params;
  const querySize = isSearchPreview ? SEARCH_PREVIEW_SIZE : SEARCH_PAGE_SIZE;

  // if !communityScope search only...

  try {
    const discussions = await searchDiscussions(searchTerm, querySize);
    console.log({ discussions });
    app.searchCache[SearchType.Discussion] = discussions.map((discussion) => {
      discussion.contentType = discussion.root_id ? ContentType.Comment : ContentType.Thread;
      discussion.searchType = SearchType.Discussion;
      return discussion;
    });

    if (memberScope) {
      console.log('loading over');
      vnode.state.searchLoading = false;
      vnode.state.errorText = null;
      m.redraw();
      return;
    }

    const addrs = await searchMentionableAddresses(searchTerm, querySize, ['created_at', 'DESC']);
    console.log({ addrs });
    app.searchCache[SearchType.Member] = addrs.map((addr) => {
      addr.contentType = ContentType.Member;
      addr.searchType = SearchType.Member;
      return addr;
    });
    m.redraw();

    if (communityScope) {
      console.log('loading over');
      app.searchCache.loaded = true;
      vnode.state.searchLoading = false;
      vnode.state.errorText = null;
      m.redraw();
      return;
    }

    const unfilteredTokens = await getTokenLists();
    const tokens = unfilteredTokens.filter((token) => token.name?.toLowerCase().includes(searchTerm));
    console.log({ tokens });
    app.searchCache[SearchType.Community] = tokens.map((token) => {
      token.contentType = ContentType.Token;
      token.searchType = SearchType.Community;
      return token;
    });

    const comms = await searchChainsAndCommunities(searchTerm, querySize);
    console.log(comms);
    app.searchCache[SearchType.Community] = app.searchCache[SearchType.Community]
      .concat(comms.map((commOrChain) => {
        commOrChain.contentType = commOrChain.created_at ? ContentType.Community : ContentType.Chain;
        commOrChain.searchType = SearchType.Community;
        return commOrChain;
      }));

    console.log('loading over');
    vnode.state.searchLoading = false;
    vnode.state.errorText = null;
    vnode.state.results = getResultsPreview(vnode.state.searchTerm, true);
    m.redraw();
  } catch (err) {
    console.log('FETCHING ERROR');
    // TODO: Ensure error-catching operational
    vnode.state.searchLoading = false;
    vnode.state.errorText = err.responseJSON?.error || err.responseText || err.toString();
    m.redraw();
  }
};

const SearchBar : m.Component<{}, {
  results: any[],
  searchLoading: boolean,
  searchTerm: string,
  searchModified: boolean,
  fromPrefix: string,
  inPrefix: string,
  errorText: string,
  focused: boolean,
}> = {
  view: (vnode) => {
    // if (m.route.param('q') && !vnode.state.searchModified) {
    //   vnode.state.searchTerm = m.route.param('q').toLowerCase();
    //   vnode.state.searchPrefix = SearchPrefix.COMMUNITY;
    // }
    const inCommunity = app.chain || app.community;
    if (!vnode.state.searchTerm) vnode.state.searchTerm = '';

    // When user types in from: or in:, dropdown only shows options for completing those terms
    // When user types in both, shows options for both together

    const { fromPrefix, inPrefix, results, searchTerm } = vnode.state;
    const value = inPrefix
      ? fromPrefix
        ? `in:${inPrefix} from:${fromPrefix} ${searchTerm}`
        : `in:${inPrefix} ${searchTerm}`
      : fromPrefix
        ? `from:${fromPrefix} ${searchTerm}`
        : searchTerm;

    return m(ControlGroup, {
      class: vnode.state.focused ? 'SearchBar focused' : 'SearchBar'
    }, [
      m(Input, {
        placeholder: 'Type to search...',
        autofocus: true,
        fluid: true,
        defaultValue: m.route.param('q') || vnode.state.searchTerm,
        value,
        oncreate: (e) => {
          if ((e.dom?.children[0] as HTMLInputElement)?.value) {
            vnode.state.searchTerm = (e.dom.children[0] as HTMLInputElement).value.toLowerCase();
          }
        },
        onclick: async (e) => {
          vnode.state.focused = true;
          if (inCommunity) {
            vnode.state.inPrefix = `${inCommunity.id}`;
          }
        },
        // contentLeft,
        oninput: async (e) => {
          if (!vnode.state.searchModified) {
            vnode.state.searchModified = true;
          }
          vnode.state.searchTerm = e.target.value?.toLowerCase();
          if (e.target.value?.length > 2) {
            // TODO: Hook up community from & address in params
            await search(vnode.state.searchTerm, {}, vnode);
          }
        },
        onkeyup: (e) => {
          if (e.key === 'Enter') {
            debugger
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
      }),
      // TODO: Addrs are showing twice
      (results?.length > 0)
      && m(List, results)
    ]);
  }
};

export default SearchBar;
