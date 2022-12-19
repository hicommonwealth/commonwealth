/* @jsx m */

import m from 'mithril';
import ClassComponent from 'class_component';
import moment from 'moment';
import { Icon, Icons, ListItem, Tag } from 'construct-ui';

import 'pages/search/search_bar.scss';

import app from 'state';
import { notifyError } from 'controllers/app/notifications';
import { Profile, AddressInfo, SearchQuery } from 'models';
import { SearchScope } from 'models/SearchQuery';
import { SearchContentType } from 'types';
import { CommunityLabel } from '../../components/community_label';
import { renderQuillTextBody } from '../../components/quill/helpers';
import User, { UserBlock } from '../../components/widgets/user';

const getMemberPreview = (
  addr,
  // closeResultsFn,
  searchTerm
  // setUsingFilterMenuFn
) => {
  const profile: Profile = app.profiles.getProfile(addr.chain, addr.address);

  if (addr.name) profile.initialize(addr.name, null, null, null, null);

  const userLink = `${
    app.isCustomDomain() ? '' : `/${app.activeChainId() || addr.chain}`
  }/account/${addr.address}?base=${addr.chain}`;

  return m(ListItem, {
    label: m(UserBlock, {
      user: profile,
      searchTerm,
      avatarSize: 24,
      showAddressWithDisplayName: true,
      addressDisplayOptions: { showFullAddress: true },
    }),
    onclick: () => {
      m.route.set(userLink);
      // closeResultsFn();
    },
    onkeyup: (e) => {
      if (e.key === 'Enter') {
        m.route.set(userLink);
        // closeResultsFn();
      }
    },
    // onmouseover: () => setUsingFilterMenuFn(true),
    // onmouseout: () => setUsingFilterMenuFn(false),
  });
};

const getCommunityPreview = (
  community
  // closeResultsFn
  // setUsingFilterMenuFn
) => {
  const params =
    community.contentType === SearchContentType.Token
      ? { community }
      : community.contentType === SearchContentType.Chain
      ? { community }
      : null;

  // params['size'] = 'large';

  const onSelect = () => {
    // if (params.community) {
    //   m.route.set(
    //     params.community.address
    //       ? `/${params.community.address}`
    //       : params.community.id
    //       ? `/${params.community.id}`
    //       : '/'
    //   );
    // }
    // closeResultsFn();
  };

  return m(ListItem, {
    label: (
      <a class="search-results-item community-result">
        {/* <CommunityLabel {...params} /> */}
      </a>
    ),
    onclick: onSelect,
    onkeyup: (e) => {
      if (e.key === 'Enter') {
        onSelect();
      }
    },
    // onmouseover: () => setUsingFilterMenuFn(true),
    // onmouseout: () => setUsingFilterMenuFn(false),
  });
};

const getDiscussionPreview = (
  thread,
  // closeResultsFn,
  searchTerm
  // setUsingFilterMenuFn
) => {
  const proposalId = thread.proposalid;

  const chain = thread.chain;

  const onSelect = () => {
    if (!chain) {
      notifyError('Discussion not found.');
      return;
    }
    m.route.set(`/${chain}/discussion/${proposalId}`);
    // closeResultsFn();
  };

  return m(ListItem, {
    onclick: onSelect,
    onkeyup: (e) => {
      if (e.key === 'Enter') {
        onSelect();
      }
    },
    // onmouseover: () => setUsingFilterMenuFn(true),
    // onmouseout: () => setUsingFilterMenuFn(false),
    label: (
      <a class="search-results-item">
        <div class="search-results-thread-title">
          {decodeURIComponent(thread.title)}
        </div>
        <div class="search-results-thread-subtitle">
          <span class="created-at">{moment(thread.created_at).fromNow()}</span>
          {m(User, {
            user: new AddressInfo(
              thread.address_id,
              thread.address,
              thread.address_chain,
              null
            ),
          })}
        </div>
        <div class="search-results-thread-body">
          {renderQuillTextBody(thread.body, {
            hideFormatting: true,
            collapse: true,
            searchTerm,
          })}
        </div>
      </a>
    ),
  });
};

const getCommentPreview = (
  comment,
  // closeResultsFn,
  searchTerm
  // setUsingFilterMenuFn
) => {
  const proposalId = comment.proposalid;

  const chain = comment.chain;

  const onSelect = () => {
    if (!chain) {
      notifyError('Discussion not found.');
      return;
    }
    m.route.set(
      `/${chain}/proposal/${proposalId.split('_')[0]}/${
        proposalId.split('_')[1]
      }`
    );
    // closeResultsFn();
  };

  return m(ListItem, {
    onclick: onSelect,
    onkeyup: (e) => {
      if (e.key === 'Enter') {
        onSelect();
      }
    },
    // onmouseover: () => setUsingFilterMenuFn(true),
    // onmouseout: () => setUsingFilterMenuFn(false),
    label: (
      <a class="search-results-item">
        <div class="search-results-thread-title">
          {`Comment on ${decodeURIComponent(comment.title)}`}
        </div>
        <div class="search-results-thread-subtitle">
          <span class="created-at">{moment(comment.created_at).fromNow()}</span>
          {m(User, {
            user: new AddressInfo(
              comment.address_id,
              comment.address,
              comment.address_chain,
              null
            ),
          })}
        </div>
        <div class="search-results-comment">
          {renderQuillTextBody(comment.text, {
            hideFormatting: true,
            collapse: true,
            searchTerm,
          })}
        </div>
      </a>
    ),
  });
};

const getBalancedContentListing = (
  unfilteredResults: Record<string, Array<any>>,
  types: Array<SearchScope>
) => {
  const results = {};

  let unfilteredResultsLength = 0;

  for (const key of types) {
    results[key] = [];
    unfilteredResultsLength += unfilteredResults[key]?.length || 0;
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

const getResultsPreview = (searchQuery: SearchQuery, state) => {
  const types = searchQuery.getSearchScope();

  const results = getBalancedContentListing(
    app.search.getByQuery(searchQuery).results,
    types
  );

  const organizedResults = [];

  types.forEach((type: SearchScope) => {
    const result = results[type];

    if (result?.length === 0) {
      return;
    }

    // const headerEle = m(ListItem, {
    //   label: type,
    //   class: `disabled ${organizedResults.length === 0 ? 'upper-border' : ''}`,
    //   onclick: (e) => {
    //     e.preventDefault();
    //     e.stopPropagation();
    //   },
    // });

    // organizedResults.push(headerEle);

    result.forEach((item) => {
      console.log(item);

      const resultRow =
        item.searchType === SearchScope.Threads
          ? getDiscussionPreview(
              item,
              // state.closeResults,
              searchQuery.searchTerm
              // state.setUsingFilterMenu
            )
          : item.searchType === SearchScope.Members
          ? getMemberPreview(
              item,
              // state.closeResults,
              searchQuery.searchTerm
              // state.setUsingFilterMenu
            )
          : item.searchType === SearchScope.Communities
          ? getCommunityPreview(
              item
              // state.closeResults
              // state.setUsingFilterMenu
            )
          : item.searchType === SearchScope.Replies
          ? getCommentPreview(
              item,
              // state.closeResults,
              searchQuery.searchTerm
              // state.setUsingFilterMenu
            )
          : null;

      organizedResults.push(resultRow);
    });
  });

  // console.log(organizedResults);

  return organizedResults;
};

export const getSearchHistoryPreview = (
  searchQuery: SearchQuery,
  setFilterMenuActive,
  executeSearch
) => {
  const scopeTags =
    searchQuery.searchScope[0] === SearchScope.All
      ? []
      : searchQuery.searchScope.map((scope) =>
          m(Tag, { label: SearchScope[scope].toLowerCase() })
        );

  if (searchQuery.chainScope && !app.isCustomDomain()) {
    scopeTags.unshift(
      m(Tag, {
        label: searchQuery.chainScope.toLowerCase(),
        class: 'search-history-primary-tag',
      })
    );
  }

  if (scopeTags.length > 1) {
    scopeTags.splice(-1, 0, <p class="search-history-tag-seperator">and</p>);
  }

  if (scopeTags.length >= 1) {
    scopeTags.unshift(m(Icon, { name: Icons.ARROW_RIGHT }));
  }

  return m(ListItem, {
    class: 'search-history-item',
    onclick: () => {
      app.search.removeFromHistory(searchQuery);
      executeSearch(searchQuery);
    },
    onmouseover: () => {
      setFilterMenuActive(true);
    },
    onmouseout: () => {
      setFilterMenuActive(false);
    },
    contentLeft: (
      <>
        <p class="search-history-query">{searchQuery.searchTerm}</p>
        {scopeTags}
      </>
    ),
    contentRight: m(Icon, {
      name: Icons.X,
      onclick: () => {
        app.search.removeFromHistory(searchQuery);
      },
    }),
  });
};

export const search = async (searchQuery: SearchQuery, state) => {
  try {
    await app.search.search(searchQuery);
  } catch (err) {
    console.error(err);
    state.results = {};
    state.errorText =
      err.responseJSON?.error || err.responseText || err.toString();
  }

  state.results = searchQuery.isSearchPreview
    ? getResultsPreview(searchQuery, state)
    : app.search.getByQuery(searchQuery).results;

  m.redraw();
};

export const executeSearch = (query: SearchQuery) => {
  if (!query.searchTerm || !query.searchTerm.toString().trim()) {
    notifyError('Enter a valid search term');
    return;
  }

  if (query.searchTerm.length < 4) {
    notifyError('Query must be at least 4 characters');
  }

  query.isSearchPreview = false;

  app.search.addToHistory(query);

  m.route.set(`/search?${query.toUrlParams()}`);
};
