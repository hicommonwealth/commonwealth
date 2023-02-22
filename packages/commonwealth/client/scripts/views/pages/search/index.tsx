import React from 'react';

import {
  ClassComponent,
  _DEPRECATED_getSearchParams,
  redraw,
} from 'mithrilInterop';
import _, { capitalize } from 'lodash';
import { notifyError } from 'controllers/app/notifications';

import { pluralize } from 'helpers';
import moment from 'moment';

import 'pages/search/index.scss';
import app from 'state';
import { SearchContentType } from 'types';
import { SearchScope, SearchSort } from 'models/SearchQuery';
import { AddressInfo, SearchQuery } from 'models';
import type { Profile } from 'models';
import { PageLoading } from 'views/pages/loading';
import Sublayout from 'views/sublayout';
import { CommunityLabel } from '../../components/community_label';
import { CWIcon } from '../../components/component_kit/cw_icons/cw_icon';
import { CWSpinner } from '../../components/component_kit/cw_spinner';
import { CWTab, CWTabBar } from '../../components/component_kit/cw_tabs';
import { CWText } from '../../components/component_kit/cw_text';
import { renderQuillTextBody } from '../../components/quill/helpers';
import { PageNotFound } from '../404';
import ErrorPage from '../error';
import { CWDropdown } from '../../components/component_kit/cw_dropdown';
import { User } from '../../components/user/user';
import withRouter from 'navigation/helpers';

const SEARCH_PAGE_SIZE = 50; // must be same as SQL limit specified in the database query

const getDiscussionResult = (thread, searchTerm, setRoute) => {
  const proposalId = thread.proposalid;
  const chain = thread.chain;

  if (app.isCustomDomain() && app.customDomainId() !== chain) return;

  return (
    <div
      className="search-result-row"
      onClick={() => {
        setRoute(`/${chain}/discussion/${proposalId}`);
      }}
    >
      <CWIcon iconName="feedback" />
      <div className="inner-container">
        <CWText fontStyle="uppercase" type="caption" className="thread-header">
          {`discussion - ${thread.chain}`}
        </CWText>
        <CWText fontWeight="medium">{decodeURIComponent(thread.title)}</CWText>
        <div className="search-results-thread-subtitle">
          <User
            user={
              new AddressInfo(
                thread.address_id,
                thread.address,
                thread.address_chain,
                null
              )
            }
          />
          <CWText className="created-at">
            {moment(thread.created_at).fromNow()}
          </CWText>
        </div>
        <CWText noWrap>
          {renderQuillTextBody(thread.body, {
            hideFormatting: true,
            searchTerm,
          })}
        </CWText>
      </div>
    </div>
  );
};

const getCommentResult = (comment, searchTerm, setRoute) => {
  const proposalId = comment.proposalid;
  const chain = comment.chain;

  if (app.isCustomDomain() && app.customDomainId() !== chain) return;

  return (
    <div
      className="search-result-row"
      onClick={() => {
        setRoute(
          `/${chain}/discussion/${proposalId.split('_')[0]}/${
            proposalId.split('_')[1]
          }`
        );
      }}
    >
      <CWIcon iconName="feedback" />
      <div className="inner-container">
        <CWText fontWeight="medium">{`comment - ${
          comment.chain || comment.community
        }`}</CWText>
        {/* <div className="search-results-thread-title">
          {decodeURIComponent(comment.title)}
        </div> */}
        <div className="search-results-thread-subtitle">
          <User
            user={
              new AddressInfo(
                comment.address_id,
                comment.address,
                comment.address_chain,
                null
              )
            }
          />
          <CWText className="created-at">
            {moment(comment.created_at).fromNow()}
          </CWText>
        </div>
        <CWText noWrap>
          {renderQuillTextBody(comment.text, {
            hideFormatting: true,
            searchTerm,
          })}
        </CWText>
      </div>
    </div>
  );
};

const getCommunityResult = (community, setRoute) => {
  const params =
    community.SearchContentType === SearchContentType.Token
      ? { community }
      : community.SearchContentType === SearchContentType.Chain
      ? { community }
      : null;

  const onSelect = () => {
    if (params.community) {
      setRoute(params.community.id ? `/${params.community.id}` : '/');
    } else {
      setRoute(community.id ? `/${community.id}` : '/');
    }
  };

  return (
    <div className="community-result-row" onClick={onSelect}>
      <CommunityLabel {...params} />
    </div>
  );
};

const getMemberResult = (addr) => {
  const profile: Profile = app.profiles.getProfile(addr.chain, addr.address);
  if (addr.name) profile.initialize(addr.name, null, null, null, null);

  if (app.isCustomDomain() && app.customDomainId() !== addr.chain) return;

  return (
    <div className="member-result-row">
      <User
        user={profile}
        showRole
        linkify
        avatarSize={32}
        showAddressWithDisplayName
      />
    </div>
  );
};

const getListing = (
  results: any,
  searchTerm: string,
  pageCount: number,
  sort: SearchSort,
  searchType: SearchScope,
  setRoute: any
) => {
  if (Object.keys(results).length === 0 || !results[searchType]) return [];

  const tabScopedResults = results[searchType]
    .map((res) => {
      return res.searchType === SearchScope.Threads
        ? getDiscussionResult(res, searchTerm, setRoute)
        : res.searchType === SearchScope.Members
        ? getMemberResult(res)
        : res.searchType === SearchScope.Communities
        ? getCommunityResult(res, setRoute)
        : res.searchType === SearchScope.Replies
        ? getCommentResult(res, searchTerm, setRoute)
        : null;
    })
    .slice(0, pageCount * 50);

  return tabScopedResults;
};

const search = async (searchQuery: SearchQuery, state) => {
  try {
    await app.search.search(searchQuery);
  } catch (err) {
    state.results = {};
    notifyError(err.responseJSON?.error || err.responseText || err.toString());
  }

  state.results = app.search.getByQuery(searchQuery).results;

  app.search.addToHistory(searchQuery);

  redraw();
};

type SearchPageAttrs = {
  results: any[];
};

class SearchPageComponent extends ClassComponent<SearchPageAttrs> {
  private activeTab: SearchScope;
  private errorText: string;
  private pageCount: number;
  private refreshResults: boolean;
  private results: any;
  private searchQuery: SearchQuery;

  view() {
    const searchQuery = SearchQuery.fromUrlParams({
      url: _DEPRECATED_getSearchParams(),
    });

    const { chainScope, searchTerm } = searchQuery;
    const scope = app.isCustomDomain() ? app.customDomainId() : chainScope;

    if (!app.search.isValidQuery(searchQuery)) {
      this.errorText =
        'Must enter query longer than 3 characters to begin searching';

      return (
        <PageNotFound
          title="Search"
          message="Please enter a query longer than 3 characters to begin searching"
        />
      );
    }

    // re-fetch results for new search if search term or URI has changed
    if (!_.isEqual(searchQuery, this.searchQuery) || this.refreshResults) {
      this.searchQuery = searchQuery;
      this.refreshResults = false;
      this.results = {};
      search(searchQuery, this);
      return <PageLoading />;
    }

    if (!app.search.getByQuery(searchQuery)?.loaded) {
      return <PageLoading />;
    }

    if (!this.activeTab) {
      this.activeTab = searchQuery.getSearchScope()[0];
    }
    if (!this.pageCount) {
      this.pageCount = 1;
    }

    const { results, pageCount, activeTab } = this;

    const getTab = (searchScope: SearchScope) => {
      return (
        <CWTab
          label={searchScope}
          isSelected={this.activeTab === searchScope}
          onClick={() => {
            this.pageCount = 1;
            this.activeTab = searchScope;
          }}
        />
      );
    };

    const tabs = this.searchQuery.getSearchScope().map(getTab);

    const tabScopedListing = getListing(
      results,
      searchTerm,
      pageCount,
      searchQuery.sort,
      activeTab,
      this.setRoute
    );

    const resultCount =
      tabScopedListing.length === SEARCH_PAGE_SIZE
        ? `${tabScopedListing.length}+ ${pluralize(
            2,
            activeTab.toLowerCase()
          ).replace('2 ', '')}`
        : pluralize(tabScopedListing.length, activeTab.toLowerCase());

    const getCaptionScope = () => {
      if (scope) {
        return `in ${capitalize(scope)}.`;
      } else if (app.isCustomDomain()) {
        return '';
      } else {
        return 'across all communities.';
      }
    };

    return this.errorText?.length > 0 ? (
      <ErrorPage message={this.errorText} />
    ) : (
      <Sublayout>
        <div className="SearchPage">
          <>
            {!app.search.getByQuery(searchQuery)?.loaded ? (
              <CWSpinner size="xl" />
            ) : (
              <div className="search-results">
                <CWTabBar>{tabs}</CWTabBar>
                <CWText isCentered className="search-results-caption">
                  {resultCount} matching '{this.searchQuery.searchTerm}'{' '}
                  {getCaptionScope()}
                  {scope && !app.isCustomDomain() && (
                    <a
                      href="#"
                      className="search-all-communities"
                      onClick={() => {
                        searchQuery.chainScope = undefined;
                        this.setRoute(`/search?${searchQuery.toUrlParams()}`);
                        setTimeout(() => {
                          this.refreshResults = true;
                        }, 0);
                      }}
                    >
                      Search all communities?
                    </a>
                  )}
                </CWText>
                {tabScopedListing.length > 0 && this.activeTab === 'Threads' && (
                  <div className="search-results-filters">
                    <CWText type="h5">Sort By:</CWText>
                    <CWDropdown
                      label=""
                      initialValue={{
                        label: this.searchQuery.sort,
                        value: this.searchQuery.sort,
                      }}
                      options={[
                        { label: 'Best', value: 'Best' },
                        { label: 'Newest', value: 'Newest' },
                        { label: 'Oldest', value: 'Oldest' },
                      ]}
                      onSelect={(o) => {
                        searchQuery.sort = SearchSort[o.value];
                        this.setRoute(`/search?${searchQuery.toUrlParams()}`);
                        setTimeout(() => {
                          this.refreshResults = true;
                        }, 0);
                      }}
                    />
                  </div>
                )}
                <div className="search-results-list">{tabScopedListing}</div>
              </div>
            )}
          </>
        </div>
      </Sublayout>
    );
  }
}

const SearchPage = withRouter(SearchPageComponent);

export default SearchPage;
