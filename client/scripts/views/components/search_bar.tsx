/* @jsx m */

import m from 'mithril';
import $ from 'jquery';
import moment from 'moment';
import {
  ControlGroup,
  Icon,
  Icons,
  Input,
  List,
  ListItem,
  Spinner,
  Button,
  Size,
  Tag,
} from 'construct-ui';

import 'pages/search_bar.scss';

import app from 'state';
import { notifyError } from 'controllers/app/notifications';
import { Profile, AddressInfo, SearchQuery } from 'models';
import { SearchScope } from 'models/SearchQuery';
import { ContentType } from 'controllers/server/search';
import MarkdownFormattedText from './markdown_formatted_text';
import QuillFormattedText from './quill_formatted_text';
import User, { UserBlock } from './widgets/user';
import { CommunityLabel } from './community_label';
import { CWCommunityAvatar } from './component_kit/cw_community_avatar';

const getMemberPreview = (
  addr,
  closeResultsFn,
  searchTerm,
  tabIndex,
  setUsingFilterMenuFn,
  showChainName?
) => {
  const profile: Profile = app.profiles.getProfile(addr.chain, addr.address);

  if (addr.name) profile.initialize(addr.name, null, null, null, null);

  const userLink = `${
    app.isCustomDomain() ? '' : `/${app.activeChainId() || addr.chain}`
  }/account/${addr.address}?base=${addr.chain}`;

  return (
    <ListItem
      tabIndex={tabIndex}
      label={
        <a class="search-results-item">
          {m(UserBlock, {
            user: profile,
            searchTerm,
            avatarSize: 24,
            showAddressWithDisplayName: true,
            addressDisplayOptions: { showFullAddress: true },
            showChainName,
          })}
        </a>
      }
      onclick={() => {
        m.route.set(userLink);
        closeResultsFn();
      }}
      onkeyup={(e) => {
        if (e.key === 'Enter') {
          m.route.set(userLink);
          closeResultsFn();
        }
      }}
      onmouseover={() => setUsingFilterMenuFn(true)}
      onmouseout={() => setUsingFilterMenuFn(false)}
    />
  );
};

const getCommunityPreview = (
  community,
  closeResultsFn,
  tabIndex,
  setUsingFilterMenuFn
) => {
  const params =
    community.contentType === ContentType.Token
      ? { community }
      : community.contentType === ContentType.Chain
      ? { community }
      : null;

  params['size'] = 'large';

  const onSelect = () => {
    if (params.community) {
      m.route.set(
        params.community.address ? `/${params.community.address}` : '/'
      );
    } else {
      m.route.set(community.id ? `/${community.id}` : '/');
    }
    closeResultsFn();
  };

  return (
    <ListItem
      tabIndex={tabIndex}
      label={
        <a class="search-results-item community-result">
          <CommunityLabel {...params} />
        </a>
      }
      onclick={onSelect}
      onkeyup={(e) => {
        if (e.key === 'Enter') {
          onSelect();
        }
      }}
      onmouseover={() => setUsingFilterMenuFn(true)}
      onmouseout={() => setUsingFilterMenuFn(false)}
    />
  );
};

const getDiscussionPreview = (
  thread,
  closeResultsFn,
  searchTerm,
  tabIndex,
  setUsingFilterMenuFn
) => {
  const proposalId = thread.proposalid;

  const chainOrComm = thread.chain || thread.offchain_community;

  const onSelect = () => {
    if (!chainOrComm) {
      notifyError('Discussion not found.');
      return;
    }
    m.route.set(`/${chainOrComm}/proposal/discussion/${proposalId}`);
    closeResultsFn();
  };

  return (
    <ListItem
      tabIndex={tabIndex}
      onclick={onSelect}
      onkeyup={(e) => {
        if (e.key === 'Enter') {
          onSelect();
        }
      }}
      onmouseover={() => setUsingFilterMenuFn(true)}
      onmouseout={() => setUsingFilterMenuFn(false)}
      label={
        <a class="search-results-item">
          <div class="search-results-thread-title">
            {decodeURIComponent(thread.title)}
          </div>
          <div class="search-results-thread-subtitle">
            <span class="created-at">
              {moment(thread.created_at).fromNow()}
            </span>
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
            {(() => {
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
            })()}
          </div>
        </a>
      }
    />
  );
};

const getCommentPreview = (
  comment,
  closeResultsFn,
  searchTerm,
  tabIndex,
  setUsingFilterMenuFn
) => {
  const proposalId = comment.proposalid;

  const chainOrComm = comment.chain || comment.offchain_community;

  const onSelect = () => {
    if (!chainOrComm) {
      notifyError('Discussion not found.');
      return;
    }
    m.route.set(
      `/${chainOrComm}/proposal/${proposalId.split('_')[0]}/${
        proposalId.split('_')[1]
      }`
    );
    closeResultsFn();
  };

  return (
    <ListItem
      tabIndex={tabIndex}
      onclick={onSelect}
      onkeyup={(e) => {
        if (e.key === 'Enter') {
          onSelect();
        }
      }}
      onmouseover={() => setUsingFilterMenuFn(true)}
      onmouseout={() => setUsingFilterMenuFn(false)}
      label={
        <a class="search-results-item">
          <div class="search-results-thread-title">
            {`Comment on ${decodeURIComponent(comment.title)}`}
          </div>
          <div class="search-results-thread-subtitle">
            <span class="created-at">
              {moment(comment.created_at).fromNow()}
            </span>
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
            {(() => {
              try {
                const doc = JSON.parse(decodeURIComponent(comment.text));
                if (!doc.ops) throw new Error();
                return m(QuillFormattedText, {
                  doc,
                  hideFormatting: true,
                  collapse: true,
                  searchTerm,
                });
              } catch (e) {
                const doc = decodeURIComponent(comment.text);
                return m(MarkdownFormattedText, {
                  doc,
                  hideFormatting: true,
                  collapse: true,
                  searchTerm,
                });
              }
            })()}
          </div>
        </a>
      }
    />
  );
};

const getBalancedContentListing = (
  unfilteredResults: Record<any, any>,
  types: SearchScope[]
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
  // TODO: using chainScope instead of communityScope OK?
  const { chainScope } = searchQuery;
  const types = searchQuery.getSearchScope();
  if (types.indexOf(SearchScope.Communities) > 0) {
    types.splice(types.indexOf(SearchScope.Communities), 1);
    types.unshift(SearchScope.Communities);
  }
  const results = getBalancedContentListing(
    app.search.getByQuery(searchQuery).results,
    types
  );

  const organizedResults = [];
  let tabIndex = 1;

  types.forEach((type: SearchScope) => {
    const res = results[type];

    if (res?.length === 0) return;

    const headerEle = (
      <ListItem
        label={type}
        class={`disabled ${
          organizedResults.length === 0 ? 'upper-border' : ''
        }`}
        onclick={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
      />
    );

    organizedResults.push(headerEle);

    (res as any[]).forEach((item) => {
      tabIndex += 1;

      const resultRow =
        item.searchType === SearchScope.Threads
          ? getDiscussionPreview(
              item,
              state.closeResults,
              searchQuery.searchTerm,
              tabIndex,
              state.setUsingFilterMenu
            )
          : item.searchType === SearchScope.Members
          ? getMemberPreview(
              item,
              state.closeResults,
              searchQuery.searchTerm,
              tabIndex,
              state.setUsingFilterMenu,
              !!chainScope
            )
          : item.searchType === SearchScope.Communities
          ? getCommunityPreview(
              item,
              state.closeResults,
              tabIndex,
              state.setUsingFilterMenu
            )
          : item.searchType === SearchScope.Replies
          ? getCommentPreview(
              item,
              state.closeResults,
              searchQuery.searchTerm,
              tabIndex,
              state.setUsingFilterMenu
            )
          : null;

      organizedResults.push(resultRow);
    });
  });
  return organizedResults;
};

const getSearchHistoryPreview = (
  searchQuery: SearchQuery,
  setFilterMenuActive,
  executeSearch
) => {
  const scopeTags =
    searchQuery.searchScope[0] === SearchScope.All
      ? []
      : searchQuery.searchScope.map((scope) => (
          <Tag label={SearchScope[scope].toLowerCase()} />
        ));

  if (searchQuery.chainScope && !app.isCustomDomain()) {
    scopeTags.unshift(
      <Tag
        label={searchQuery.chainScope.toLowerCase()}
        class="search-history-primary-tag"
      />
    );
  }

  if (scopeTags.length > 1) {
    scopeTags.splice(-1, 0, <p class="search-history-tag-seperator">and</p>);
  }

  if (scopeTags.length >= 1) {
    scopeTags.unshift(<Icon name={Icons.ARROW_RIGHT} />);
  }

  return (
    <ListItem
      class="search-history-item"
      onclick={() => {
        app.search.removeFromHistory(searchQuery);
        executeSearch(searchQuery);
      }}
      onmouseover={() => {
        setFilterMenuActive(true);
      }}
      onmouseout={() => {
        setFilterMenuActive(false);
      }}
      contentLeft={
        <>
          <p class="search-history-query">{searchQuery.searchTerm}</p>
          {scopeTags}
        </>
      }
      contentRight={
        <Icon
          name={Icons.X}
          onclick={() => {
            app.search.removeFromHistory(searchQuery);
          }}
        />
      }
    />
  );
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

const executeSearch = (query: SearchQuery) => {
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

export class SearchBar implements m.Component {
  private activeChain: string;
  private activeCommunity: string;
  private closeResults: () => void;
  private errorText: string;
  private filterMenuActive: boolean;
  private focused: boolean;
  private hideResults: boolean;
  private inputTimeout: any;
  private isTyping: boolean;
  private results: any[];
  private searchQuery: SearchQuery;
  private searchTerm: string;
  private setUsingFilterMenu: (boolean) => void;

  view() {
    if (!this.searchTerm) this.searchTerm = '';

    if (!this.searchQuery) {
      this.searchQuery = m.route.get().startsWith('/search')
        ? SearchQuery.fromUrlParams(m.route.param())
        : new SearchQuery('', {
            isSearchPreview: true,
            chainScope: app.activeChainId(),
          });
      this.activeChain = app.activeChainId()
        ? app.activeChainId()
        : this.searchQuery.chainScope;
      this.isTyping = false;
    }

    if (
      this.searchQuery.searchTerm !== this.searchTerm &&
      this.searchTerm.length > 3
    ) {
      this.searchQuery.searchTerm = this.searchTerm;
    }

    const { results, searchQuery } = this;

    const setFilterMenuActive = (using: boolean) => {
      this.filterMenuActive = using;
    };

    this.closeResults = () => {
      this.hideResults = true;
    };

    this.setUsingFilterMenu = (using) => {
      this.filterMenuActive = using;
    };

    const historyList = app.search
      .getHistory()
      .map((h) =>
        getSearchHistoryPreview(h, setFilterMenuActive, executeSearch)
      );

    if (historyList.length > 0) {
      historyList.push(
        <ListItem
          class="search-history-no-results upper-border"
          // eslint-disable-next-line max-len
          label="Tip: You can use operators like \'single quotes\', and the keyword &quot;or&quot; to limit your search!"
        />
      );
    }

    const scopeTitle = <ListItem class="disabled" label="Limit search to:" />;

    const scopeToButton = (scope, disabled) => {
      return (
        <Button
          size={Size.SM}
          class={disabled ? 'disabled' : ''}
          active={this.searchQuery.searchScope.includes(scope)}
          onclick={() => {
            this.searchQuery.toggleScope(scope);
            search(this.searchQuery, this);
          }}
          onmouseover={() => {
            this.filterMenuActive = true;
          }}
          onmouseout={() => {
            this.filterMenuActive = false;
          }}
          label={scope}
        />
      );
    };

    const scopeButtons = [SearchScope.Threads, SearchScope.Replies]
      .map((s) => scopeToButton(s, false))
      .concat(
        (app.isCustomDomain()
          ? []
          : [SearchScope.Communities, SearchScope.Members]
        ).map((s) => scopeToButton(s, false))
      );

    const filterDropdown = (
      <List class="search-results-list">
        <ListItem class="disabled" label="I'm looking for: " />
        <ListItem
          class="disabled search-filter-button-bar"
          label={scopeButtons}
        />
        {this.activeChain && !app.isCustomDomain() && (
          <>
            {scopeTitle}
            <ListItem
              class="disabled"
              label={
                <Button
                  size={Size.SM}
                  onclick={() => {
                    this.searchQuery.chainScope =
                      this.searchQuery.chainScope === this.activeChain
                        ? undefined
                        : this.activeChain;
                    search(this.searchQuery, this);
                  }}
                  active={this.searchQuery.chainScope === this.activeChain}
                  onmouseover={() => {
                    this.filterMenuActive = true;
                  }}
                  onmouseout={() => {
                    this.filterMenuActive = false;
                  }}
                  label={`Inside chain: ${this.activeChain}`}
                />
              }
            />
          </>
        )}
        {this.searchTerm.length < 1 ? (
          historyList.length === 0 ? (
            <ListItem
              class="search-history-no-results upper-border"
              label="Enter a term into the field and press Enter to start"
            />
          ) : (
            <>
              <ListItem class="disabled upper-border" label="Search History" />
              {historyList}
            </>
          )
        ) : !results || results?.length === 0 ? (
          app.search.getByQuery(searchQuery)?.loaded ? (
            <ListItem
              class="search-history-no-results upper-border"
              label="No Results Found"
            />
          ) : this.isTyping ? (
            <ListItem
              class="disabled upper-border"
              label={<Spinner active={true} />}
            />
          ) : (
            <ListItem
              class="search-history-no-results upper-border"
              label="Make your query longer than 3 characters to search"
            />
          )
        ) : this.isTyping ? (
          <ListItem
            class="disabled upper-border"
            label={<Spinner active={true} />}
          />
        ) : (
          results
        )}
      </List>
    );

    const chainOrCommIcon = app.activeChainId() ? (
      <CWCommunityAvatar size="small" community={app.chain.meta} />
    ) : null;

    const cancelInputIcon = this.searchTerm ? (
      <Icon
        name={Icons.X}
        onclick={() => {
          const input = $('.SearchBar').find('input[name=search');
          input.val('');
          this.searchTerm = '';
        }}
      />
    ) : null;

    const searchIcon = this.searchTerm ? (
      <Icon
        name={Icons.CORNER_DOWN_LEFT}
        onclick={() => {
          executeSearch(this.searchQuery);
        }}
      />
    ) : null;

    return (
      <ControlGroup class="SearchBar">
        <Input
          name="search"
          placeholder="Type to search..."
          autofocus={false} // !isMobile,
          fluid={true}
          tabIndex={-10}
          contentRight={
            this.searchTerm ? (
              <ControlGroup>
                {cancelInputIcon}
                {searchIcon}
              </ControlGroup>
            ) : (
              chainOrCommIcon
            )
          }
          defaultValue={m.route.param('q') || this.searchTerm}
          value={this.searchTerm}
          autocomplete="off"
          onclick={async () => {
            this.focused = true;
          }}
          onfocusout={() => {
            if (!this.filterMenuActive) this.focused = false;
          }}
          oninput={(e) => {
            e.stopPropagation();
            this.isTyping = true;
            this.focused = true;
            this.searchTerm = e.target.value?.toLowerCase();
            clearTimeout(this.inputTimeout);
            const timeout = e.target.value?.length > 3 ? 250 : 1000;
            this.inputTimeout = setTimeout(() => {
              this.isTyping = false;
              if (e.target.value?.length > 3) {
                search(this.searchQuery, this);
              } else {
                this.searchQuery.searchTerm = e.target.value?.toLowerCase();
                this.results = [];
                m.redraw();
              }
            }, timeout);
          }}
          onkeyup={(e) => {
            e.stopPropagation();
            if (e.key === 'Enter') {
              executeSearch(this.searchQuery);
            }
          }}
        />
        {this.focused && !this.hideResults && filterDropdown}
      </ControlGroup>
    );
  }
}
