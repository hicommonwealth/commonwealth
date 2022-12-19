/* @jsx m */

import m from 'mithril';
import ClassComponent from 'class_component';

import 'pages/search/search_bar.scss';

import app from 'state';
import { SearchQuery } from 'models';
import { SearchScope } from 'models/SearchQuery';
import { CWSpinner } from '../../components/component_kit/cw_spinner';
import { getSearchHistoryPreview, executeSearch, search } from './helpers';
import { CWIconButton } from '../../components/component_kit/cw_icon_button';
import { CWText } from '../../components/component_kit/cw_text';
import { getClasses } from '../../components/component_kit/helpers';

type SearchChipAttrs = {
  isActive: boolean;
  label: string;
  onclick: () => void;
};

export class SearchChip extends ClassComponent<SearchChipAttrs> {
  view(vnode: m.Vnode<SearchChipAttrs>) {
    const { isActive, label, onclick } = vnode.attrs;

    return (
      <CWText
        type="b2"
        fontWeight="medium"
        className={getClasses<{ isActive: boolean }>(
          {
            isActive,
          },
          'SearchChip'
        )}
        onclick={onclick}
      >
        {label}
      </CWText>
    );
  }
}

export class SearchBar extends ClassComponent {
  private activeChain: string;
  private closeResults: () => void;
  private errorText: string;
  private filterMenuActive: boolean;
  private focused: boolean;
  private hideResults: boolean;
  private inputTimeout: any;
  private isTyping: boolean;
  private results: any[];
  private searchQuery: SearchQuery;
  private searchTerm: Lowercase<string>;
  private setUsingFilterMenu: (boolean) => void;

  view() {
    if (!this.searchTerm) {
      this.searchTerm = '';
    }

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
        <CWText type="caption">
          Tip: You can use operators like 'single quotes', and the keyword
          &quot;or&quot; to limit your search!
        </CWText>
      );
    }

    const scopeChips = [SearchScope.Threads, SearchScope.Replies]
      .map((s) => {
        return (
          <SearchChip
            isActive={this.searchQuery.searchScope.includes(s)}
            label={s}
            onclick={() => {
              this.searchQuery.toggleScope(s);
              // search(this.searchQuery, this);
            }}
          />
        );
      })
      .concat(
        (app.isCustomDomain()
          ? []
          : [SearchScope.Communities, SearchScope.Members]
        ).map((s) => {
          return (
            <SearchChip
              isActive={this.searchQuery.searchScope.includes(s)}
              label={s}
              onclick={() => {
                this.searchQuery.toggleScope(s);
                // search(this.searchQuery, this);
              }}
            />
          );
        })
      );

    return (
      <div class="SearchBar">
        <div class="search-and-icon-container">
          <input
            placeholder="Search Common"
            defaultValue={m.route.param('q') || this.searchTerm}
            value={this.searchTerm}
            autocomplete="off"
            onclick={async () => {
              this.focused = true;
            }}
            // onfocusout={() => {
            //   if (!this.filterMenuActive) {
            //     this.focused = false;
            //   }
            // }}
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
          <div class="searchbar-icon">
            <CWIconButton
              iconName="search"
              onclick={(e) => {
                e.stopPropagation();

                executeSearch(this.searchQuery);
              }}
            />
          </div>
          {this.focused && !this.hideResults && (
            <div class="search-results-dropdown">
              <CWText type="caption">I'm looking for</CWText>
              <div class="chips-row">{scopeChips}</div>
              {/* {this.activeChain && !app.isCustomDomain() && (
                <>
                  <CWText type="caption">Limit search to</CWText>
                  <SearchChip
                    isActive={this.searchQuery.chainScope === this.activeChain}
                    label={`Inside chain: ${this.activeChain}`}
                    onclick={() => {
                      this.searchQuery.chainScope =
                        this.searchQuery.chainScope === this.activeChain
                          ? undefined
                          : this.activeChain;
                      search(this.searchQuery, this);
                    }}
                  />
                </>
              )}
              {this.searchTerm.length < 1 ? (
                historyList.length === 0 ? (
                  <CWText type="caption">
                    Enter a term into the field and press enter to start
                  </CWText>
                ) : (
                  <>
                    <CWText type="caption">Search History</CWText>
                    {historyList}
                  </>
                )
              ) : !results || results?.length === 0 ? (
                app.search.getByQuery(searchQuery)?.loaded ? (
                  <CWText type="caption">No Results Found</CWText>
                ) : this.isTyping ? (
                  <CWSpinner size="small" />
                ) : (
                  <CWText type="caption">
                    Make your query longer than 3 characters to search
                  </CWText>
                )
              ) : this.isTyping ? (
                <CWSpinner size="small" />
              ) : (
                results
              )} */}
            </div>
          )}
        </div>
      </div>
    );
  }
}
