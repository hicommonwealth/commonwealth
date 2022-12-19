/* @jsx m */

import m from 'mithril';
import moment from 'moment';

import 'pages/search/search_bar.scss';

import app from 'state';
import { notifyError } from 'controllers/app/notifications';
import { AddressInfo, SearchQuery } from 'models';
import { SearchScope } from 'models/SearchQuery';
import { CommunityLabel } from '../../components/community_label';
import { renderQuillTextBody } from '../../components/quill/helpers';
import User from '../../components/widgets/user';
import { CWText } from '../../components/component_kit/cw_text';

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

const getResultsPreview = (searchQuery: SearchQuery) => {
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

    result.forEach((item) => {
      const resultRow =
        item.searchType === SearchScope.Threads ? (
          <div
            onclick={() =>
              m.route.set(`/${item.chain}/discussion/${item.proposalid}`)
            }
          >
            {decodeURIComponent(item.title)}
            <CWText>{moment(item.created_at).fromNow()}</CWText>
            {m(User, {
              user: new AddressInfo(
                item.address_id,
                item.address,
                item.address_chain,
                null
              ),
            })}
            {renderQuillTextBody(item.body, {
              hideFormatting: true,
              collapse: true,
              searchTerm: searchQuery.searchTerm,
            })}
          </div>
        ) : item.searchType === SearchScope.Members ? (
          m(User, {
            user: app.profiles.getProfile(item.chain, item.address),
            linkify: true,
          })
        ) : item.searchType === SearchScope.Communities ? (
          <div
            onclick={() => {
              m.route.set(
                item.address
                  ? `/${item.address}`
                  : item.id
                  ? `/${item.id}`
                  : '/'
              );
            }}
          >
            <CommunityLabel community={item} />
          </div>
        ) : item.searchType === SearchScope.Replies ? (
          <div
            onclick={() => {
              m.route.set(
                `/${item.chain}/proposal/${item.proposalid.split('_')[0]}/${
                  item.proposalid.split('_')[1]
                }`
              );
            }}
          >
            <CWText>{`Comment on ${decodeURIComponent(item.title)}`}</CWText>
            <CWText>{moment(item.created_at).fromNow()}</CWText>
            {m(User, {
              user: new AddressInfo(
                item.address_id,
                item.address,
                item.address_chain,
                null
              ),
            })}
            {renderQuillTextBody(item.text, {
              hideFormatting: true,
              collapse: true,
              searchTerm: searchQuery.searchTerm,
            })}
          </div>
        ) : null;

      organizedResults.push(resultRow);
    });
  });

  return organizedResults;
};

export const search = async (searchQuery: SearchQuery, state) => {
  try {
    await app.search.search(searchQuery);
  } catch (err) {
    state.results = {};
    notifyError(err.responseJSON?.error || err.responseText || err.toString());
  }

  state.results = searchQuery.isSearchPreview
    ? getResultsPreview(searchQuery)
    : app.search.getByQuery(searchQuery).results;

  app.search.addToHistory(searchQuery);

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
