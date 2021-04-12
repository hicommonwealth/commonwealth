import 'pages/search.scss';

import m from 'mithril';
import _, { capitalize } from 'lodash';
import { Input, List, ListItem, QueryList } from 'construct-ui';
import {
  searchMentionableAddresses,
  searchDiscussions,
  searchChainsAndCommunities,
} from 'helpers/search';
import getTokenLists from 'views/pages/home/token_lists';
import app from 'state';
import { notifyError } from 'controllers/app/notifications';
import { getCommunityResult, getDiscussionResult, getMemberResult } from '../pages/search';

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

const SEARCH_PREVIEW_SIZE = 10;
const SEARCH_PAGE_SIZE = 50; // must be same as SQL limit specified in the database query

export const search = async (searchTerm: string, params: SearchParams, vnode) => {
  vnode.state.searchLoading = true;
  // TODO: Hookup community and member scope
  const { communityScope, memberScope, isSearchPreview } = params;
  const querySize = isSearchPreview ? SEARCH_PREVIEW_SIZE : SEARCH_PAGE_SIZE;

  // if !communityScope search only...

  (async () => {
    try {
      await searchDiscussions(searchTerm, querySize).then((discussions) => {
        app.searchCache = discussions.map((discussion) => {
          discussion.contentType = discussion.root_id ? ContentType.Comment : ContentType.Thread;
          discussion.searchType = SearchType.Discussion;
          return discussion;
        });
      });

      if (memberScope) {
        console.log('loading over');
        vnode.state.searchLoading = false;
        vnode.state.errorText = null;
        m.redraw();
        return;
      }

      await searchMentionableAddresses(searchTerm, querySize, ['created_at', 'DESC']).then((addrs) => {
        app.searchCache = app.searchCache.concat(addrs.map((addr) => {
          addr.contentType = ContentType.Member;
          addr.searchType = SearchType.Member;
          return addr;
        }));
        m.redraw();
      });

      if (communityScope) {
        console.log('loading over');
        vnode.state.searchLoading = false;
        vnode.state.errorText = null;
        m.redraw();
        return;
      }

      await getTokenLists().then((unfilteredTokens) => {
        const tokens = unfilteredTokens.filter((token) => token.name?.toLowerCase().includes(searchTerm));
        app.searchCache = app.searchCache.concat(tokens.map((token) => {
          token.contentType = ContentType.Token;
          token.searchType = SearchType.Community;
          return token;
        }));
      });

      await searchChainsAndCommunities(searchTerm, querySize).then((comms) => {
        app.searchCache = app.searchCache.concat(comms.map((commOrChain) => {
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
    console.log(app.searchCache);
    vnode.state.results = app.searchCache || [];
    // if (m.route.param('q') && !vnode.state.searchModified) {
    //   vnode.state.searchTerm = m.route.param('q').toLowerCase();
    //   vnode.state.searchPrefix = SearchPrefix.COMMUNITY;
    // }
    const inCommunity = app.chain || app.community;
    console.log({ inCommunity });

    // When user types in from: or in:, dropdown only shows options for completing those terms
    // When user types in both, shows options for both together

    const { fromPrefix, inPrefix, focused, searchTerm } = vnode.state;
    console.log(vnode.state.results);
    return m(vnode.state.focused ? '.SearchBar.focused' : '.SearchBar', [
      m(Input, {
        placeholder: 'Type to search...',
        autofocus: true,
        fluid: true,
        defaultValue: m.route.param('q') || vnode.state.searchTerm,
        value: vnode.state.searchTerm,
        oncreate: (e) => {
          if ((e.dom?.children[0] as HTMLInputElement)?.value) {
            vnode.state.searchTerm = (e.dom.children[0] as HTMLInputElement).value.toLowerCase();
          }
        },
        onclick: async (e) => {
          vnode.state.focused = true;
          if (inCommunity) {
            vnode.state.inPrefix = inCommunity.id;
          }
        },
        // contentLeft,
        oninput: (e) => {
          if (!vnode.state.searchModified) {
            vnode.state.searchModified = true;
          }
          vnode.state.searchTerm = e.target.value?.toLowerCase();
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
          if (e.target.value?.length > 3) {
            // TODO: Hook up community from & address in params
            search(vnode.state.searchTerm, {}, vnode);
          }
        },
      }),
      m(List, app.searchCache.map((item) => {
        console.log(item);
        const resultRow = item.searchType === SearchType.Discussion
          ? getDiscussionResult(item, searchTerm)
          : item.searchType === SearchType.Member
            ? getMemberResult(item, searchTerm)
            : item.searchType === SearchType.Community
              ? getCommunityResult(item)
              : null;
        console.log(resultRow);
        return m(ListItem, { label: resultRow });
      }))
    ]);
  }
};

export default SearchBar;
