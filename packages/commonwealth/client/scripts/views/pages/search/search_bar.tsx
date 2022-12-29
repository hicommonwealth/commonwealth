/* @jsx jsx */
import React from 'react';

import { ClassComponent, ResultNode, render, setRoute, getRoute, getRouteParam, redraw, Component, jsx } from 'mithrilInterop';

import 'pages/search/search_bar.scss';

import app from 'state';
import { notifyError } from 'controllers/app/notifications';
import { SearchQuery } from 'models';
import { SearchScope } from 'models/SearchQuery';
import { CWIconButton } from '../../components/component_kit/cw_icon_button';
import {
  SearchBarCommentPreviewRow,
  SearchBarCommunityPreviewRow,
  SearchBarMemberPreviewRow,
  SearchBarThreadPreviewRow,
} from './search_bar_components';
import { CWText } from '../../components/component_kit/cw_text';
import { CWDivider } from '../../components/component_kit/cw_divider';
import { getClasses } from '../../components/component_kit/helpers';

const goToSearchPage = (query: SearchQuery) => {
  if (!query.searchTerm || !query.searchTerm.toString().trim()) {
    notifyError('Enter a valid search term');
    return;
  }

  if (query.searchTerm.length < 4) {
    notifyError('Query must be at least 4 characters');
  }

  app.search.addToHistory(query);

  setRoute(`/search?${query.toUrlParams()}`);
};

const getSearchPreview = async (searchQuery: SearchQuery, state) => {
  try {
    await app.search.search(searchQuery);
  } catch (err) {
    state.searchResults = {};

    notifyError(err.responseJSON?.error || err.responseText || err.toString());
  }

  state.searchResults = Object.fromEntries(
    Object.entries(app.search.getByQuery(searchQuery).results).map(([k, v]) => [
      k,
      v.slice(0, 2),
    ])
  );

  app.search.addToHistory(searchQuery);

  redraw();
};

export class SearchBar extends ClassComponent {
  private showDropdown: boolean;
  private searchResults: Record<string, Array<any>>;
  private searchQuery: SearchQuery;
  private searchTerm: Lowercase<string>;

  oninit() {
    this.searchTerm = '';
  }

  view() {
    // const historyList = app.search.getHistory().map((previousQuery) => (
    //   <div
    //     className="history-row"
    //     onClick={() => {
    //       this.searchTerm = previousQuery.searchTerm;
    //       getSearchPreview(previousQuery, this);
    //     }}
    //   >
    //     {previousQuery.searchTerm}
    //     <CWIconButton
    //       iconName="close"
    //       onClick={(e) => {
    //         e.stopPropagation();
    //         app.search.removeFromHistory(previousQuery);
    //       }}
    //     />
    //   </div>
    // ));

    const handleGetSearchPreview = () => {
      this.searchQuery = new SearchQuery(this.searchTerm, {
        isSearchPreview: true,
        chainScope: app.activeChainId(),
      });

      getSearchPreview(this.searchQuery, this);
    };

    const handleGoToSearchPage = () => {
      if (this.searchTerm.length < 3) {
        return;
      } else {
        this.searchQuery = new SearchQuery(this.searchTerm, {
          isSearchPreview: false,
          chainScope: app.activeChainId(),
        });
      }

      goToSearchPage(this.searchQuery);
    };

    return (
      <div className="SearchBar">
        <div className="search-and-icon-container">
          <div className="search-icon">
            <CWIconButton iconName="search" onClick={handleGoToSearchPage} />
          </div>
          <input
            className={getClasses<{ isClearable: boolean }>({
              isClearable: this.searchTerm.length > 0,
            })}
            placeholder="Search Common"
            defaultValue={getRouteParam('q') || this.searchTerm}
            value={this.searchTerm}
            autocomplete="off"
            onfocus={() => {
              this.showDropdown = true;
            }}
            onblur={() => {
              setTimeout(() => {
                this.showDropdown = false;
                redraw();
              }, 500); // hack to prevent the dropdown closing too quickly on click
            }}
            oninput={(e) => {
              this.searchTerm = e.target.value?.toLowerCase();

              if (this.searchTerm.length > 3) {
                handleGetSearchPreview();
              }
            }}
            onkeyup={(e) => {
              if (e.key === 'Enter') {
                handleGoToSearchPage();
              }
            }}
          />
          {this.searchTerm.length > 0 && (
            <div className="clear-icon">
              <CWIconButton
                iconName="close"
                onClick={() => {
                  this.searchTerm = '';
                }}
              />
            </div>
          )}
          {this.searchResults && this.showDropdown && (
            <div className="search-results-dropdown">
              {Object.values(this.searchResults).flat(1).length > 0 ? (
                <div className="previews-section">
                  {Object.entries(this.searchResults).map(([k, v]) => {
                    if (k === SearchScope.Threads && v.length > 0) {
                      return (
                        <div className="preview-section">
                          <div className="section-header">
                            <CWText
                              type="caption"
                              className="section-header-text"
                            >
                              Threads
                            </CWText>
                            <CWDivider />
                          </div>
                          {v.map((res) => (
                            <SearchBarThreadPreviewRow
                              searchResult={res}
                              searchTerm={this.searchQuery.searchTerm}
                            />
                          ))}
                        </div>
                      );
                    } else if (k === SearchScope.Replies && v.length > 0) {
                      return (
                        <div className="preview-section">
                          <div className="section-header">
                            <CWText
                              type="caption"
                              className="section-header-text"
                            >
                              Comments
                            </CWText>
                            <CWDivider />
                          </div>
                          {v.map((res) => (
                            <SearchBarCommentPreviewRow
                              searchResult={res}
                              searchTerm={this.searchQuery.searchTerm}
                            />
                          ))}
                        </div>
                      );
                    } else if (k === SearchScope.Communities && v.length > 0) {
                      return (
                        <div className="preview-section">
                          <div className="section-header">
                            <CWText
                              type="caption"
                              className="section-header-text"
                            >
                              Communities
                            </CWText>
                            <CWDivider />
                          </div>
                          {v.map((res) => (
                            <SearchBarCommunityPreviewRow searchResult={res} />
                          ))}
                        </div>
                      );
                    } else if (k === SearchScope.Members && v.length > 0) {
                      return (
                        <div className="preview-section">
                          <div className="section-header">
                            <CWText
                              type="caption"
                              className="section-header-text"
                            >
                              Members
                            </CWText>
                            <CWDivider />
                          </div>
                          {v.map((res) => (
                            <SearchBarMemberPreviewRow searchResult={res} />
                          ))}
                        </div>
                      );
                    } else {
                      return null;
                    }
                  })}
                </div>
              ) : (
                <CWText type="caption" className="no-results-text">
                  No Results
                </CWText>
              )}
              {/* {historyList.length > 0 && (
                <div className="history-section">
                  <CWText
                    type="caption"
                    fontWeight="medium"
                    className="search-history-header"
                  >
                    Search History
                  </CWText>
                  {historyList}
                </div>
              )} */}
            </div>
          )}
        </div>
      </div>
    );
  }
}
