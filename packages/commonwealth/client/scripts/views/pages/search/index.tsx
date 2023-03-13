/* @jsx m */

import ClassComponent from 'class_component';
import { notifyError } from 'controllers/app/notifications';

import { pluralize } from 'helpers';
import _, { capitalize } from 'lodash';
import m from 'mithril';
import type { MinimumProfile as Profile } from 'models';
import { SearchQuery, AddressAccount } from 'models';
import { SearchScope, SearchSort } from 'models/SearchQuery';
import moment from 'moment';

import 'pages/search/index.scss';
import app from 'state';
import { SearchContentType } from 'types';
import User from 'views/components/widgets/user';
import { PageLoading } from 'views/pages/loading';
import Sublayout from 'views/sublayout';
import { BreadcrumbsTitleTag } from '../../components/breadcrumbs_title_tag';
import { CommunityLabel } from '../../components/community_label';
import { CWIcon } from '../../components/component_kit/cw_icons/cw_icon';
import { CWSpinner } from '../../components/component_kit/cw_spinner';
import { CWTab, CWTabBar } from '../../components/component_kit/cw_tabs';
import { CWText } from '../../components/component_kit/cw_text';
import { renderQuillTextBody } from '../../components/quill/helpers';
import { PageNotFound } from '../404';
import ErrorPage from '../error';
import { CWDropdown } from '../../components/component_kit/cw_dropdown';

const SEARCH_PAGE_SIZE = 50; // must be same as SQL limit specified in the database query

const getDiscussionResult = (thread, searchTerm) => {
  const proposalId = thread.proposalid;
  const chain = thread.chain;

  if (app.isCustomDomain() && app.customDomainId() !== chain) return;

  return (
    <div
      class="search-result-row"
      onclick={() => {
        m.route.set(`/${chain}/discussion/${proposalId}`);
      }}
    >
      <CWIcon iconName="feedback" />
      <div class="inner-container">
        <CWText fontStyle="uppercase" type="caption" className="thread-header">
          {`discussion - ${thread.chain}`}
        </CWText>
        <CWText fontWeight="medium">{decodeURIComponent(thread.title)}</CWText>
        <div class="search-results-thread-subtitle">
          {m(User, {
            user: new AddressAccount({
              address: thread.address,
              addressId: thread.address_id,
              chain: app.config.chains.getById(thread.address_chain),
            }),
          })}
          <CWText className="created-at">
            {moment(thread.created_at).fromNow()}
          </CWText>
        </div>
        <CWText noWrap>
          {renderQuillTextBody(thread.body, {
            hideFormatting: true,
            collapse: true,
            searchTerm,
          })}
        </CWText>
      </div>
    </div>
  );
};

const getCommentResult = (comment, searchTerm) => {
  const proposalId = comment.proposalid;
  const chain = comment.chain;

  if (app.isCustomDomain() && app.customDomainId() !== chain) return;

  return (
    <div
      class="search-result-row"
      onclick={() => {
        m.route.set(
          `/${chain}/discussion/${proposalId.split('_')[0]}/${
            proposalId.split('_')[1]
          }`
        );
      }}
    >
      <CWIcon iconName="feedback" />
      <div class="inner-container">
        <CWText fontWeight="medium">{`comment - ${
          comment.chain || comment.community
        }`}</CWText>
        {/* <div class="search-results-thread-title">
          {decodeURIComponent(comment.title)}
        </div> */}
        <div class="search-results-thread-subtitle">
          {m(User, {
            user: new AddressAccount({
              address: comment.address,
              addressId: comment.address_id,
              chain: app.config.chains.getById(comment.address_chain),
            }),
          })}
          <CWText className="created-at">
            {moment(comment.created_at).fromNow()}
          </CWText>
        </div>
        <CWText noWrap>
          {renderQuillTextBody(comment.text, {
            hideFormatting: true,
            collapse: true,
            searchTerm,
          })}
        </CWText>
      </div>
    </div>
  );
};

const getCommunityResult = (community) => {
  const params =
    community.SearchContentType === SearchContentType.Token
      ? { community }
      : community.SearchContentType === SearchContentType.Chain
      ? { community }
      : null;

  const onSelect = () => {
    if (params.community) {
      m.route.set(params.community.id ? `/${params.community.id}` : '/');
    } else {
      m.route.set(community.id ? `/${community.id}` : '/');
    }
  };

  return (
    <div class="community-result-row" onclick={onSelect}>
      <CommunityLabel {...params} />
    </div>
  );
};

const getMemberResult = (addr) => {
  const profile: Profile = app.newProfiles.getProfile(addr.chain, addr.address);
  if (addr.name) profile.initialize(addr.name, null, null, null, null, null);

  if (app.isCustomDomain() && app.customDomainId() !== addr.chain) return;

  return (
    <div class="member-result-row">
      {m(User, {
        user: profile,
        showRole: true,
        linkify: true,
        avatarSize: 32,
        showAddressWithDisplayName: true,
      })}
    </div>
  );
};

const getListing = (
  results: any,
  searchTerm: string,
  pageCount: number,
  sort: SearchSort,
  searchType?: SearchScope
) => {
  if (Object.keys(results).length === 0 || !results[searchType]) return [];

  const tabScopedResults = results[searchType]
    .map((res) => {
      return res.searchType === SearchScope.Threads
        ? getDiscussionResult(res, searchTerm)
        : res.searchType === SearchScope.Members
        ? getMemberResult(res)
        : res.searchType === SearchScope.Communities
        ? getCommunityResult(res)
        : res.searchType === SearchScope.Replies
        ? getCommentResult(res, searchTerm)
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

  m.redraw();
};

type SearchPageAttrs = {
  results: any[];
};

class SearchPage extends ClassComponent<SearchPageAttrs> {
  private activeTab: SearchScope;
  private errorText: string;
  private pageCount: number;
  private refreshResults: boolean;
  private results: any;
  private searchQuery: SearchQuery;

  view() {
    const searchQuery = SearchQuery.fromUrlParams(m.route.param());

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
          onclick={() => {
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
      activeTab
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
      <ErrorPage
        message={this.errorText}
        title={<BreadcrumbsTitleTag title="Search" />}
      />
    ) : (
      <Sublayout>
        <div class="SearchPage">
          <>
            {!app.search.getByQuery(searchQuery)?.loaded ? (
              <CWSpinner size="xl" />
            ) : (
              <div class="search-results">
                <CWTabBar>{tabs}</CWTabBar>
                <CWText isCentered className="search-results-caption">
                  {resultCount} matching '{this.searchQuery.searchTerm}'{' '}
                  {getCaptionScope()}
                  {scope && !app.isCustomDomain() && (
                    <a
                      href="#"
                      class="search-all-communities"
                      onclick={() => {
                        searchQuery.chainScope = undefined;
                        m.route.set(`/search?${searchQuery.toUrlParams()}`);
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
                  <div class="search-results-filters">
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
                        m.route.set(`/search?${searchQuery.toUrlParams()}`);
                        setTimeout(() => {
                          this.refreshResults = true;
                        }, 0);
                      }}
                    />
                  </div>
                )}
                <div class="search-results-list">{tabScopedListing}</div>
              </div>
            )}
          </>
        </div>
      </Sublayout>
    );
  }
}

export default SearchPage;
