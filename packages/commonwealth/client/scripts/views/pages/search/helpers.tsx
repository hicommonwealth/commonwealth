import React from 'react';
import moment from 'moment';

import 'pages/search/index.scss';

import type { SearchSort } from 'models/SearchQuery';
import type { MinimumProfile as Profile } from 'models';
import app from 'state';
import { SearchContentType } from 'types';
import { SearchScope } from 'models/SearchQuery';
import { AddressInfo } from 'models';
import { CommunityLabel } from '../../components/community_label';
import { CWIcon } from '../../components/component_kit/cw_icons/cw_icon';
import { CWText } from '../../components/component_kit/cw_text';
import { User } from '../../components/user/user';
import { QuillRenderer } from '../../components/react_quill_editor/quill_renderer';
import { renderTruncatedHighlights } from '../../components/react_quill_editor/highlighter';

const getDiscussionResult = (thread, searchTerm, setRoute) => {
  const proposalId = thread.proposalid;
  const chain = thread.chain;

  if (app.isCustomDomain() && app.customDomainId() !== chain) {
    return;
  }

  return (
    <div
      key={proposalId}
      className="search-result-row"
      onClick={() => setRoute(`/discussion/${proposalId}`)}
    >
      <CWIcon iconName="feedback" />
      <div className="inner-container">
        <CWText fontStyle="uppercase" type="caption" className="thread-header">
          {`discussion - ${thread.chain}`}
        </CWText>
        <CWText className="search-results-thread-title" fontWeight="medium">
          {renderTruncatedHighlights(
            searchTerm,
            decodeURIComponent(thread.title)
          )}
        </CWText>
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
          <QuillRenderer
            hideFormatting={true}
            doc={thread.body}
            searchTerm={searchTerm}
          />
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
      key={comment.id}
      className="search-result-row"
      onClick={() => {
        const path = `/discussion/${proposalId}`;
        setRoute(path);
      }}
    >
      <CWIcon iconName="feedback" />
      <div className="inner-container">
        <CWText fontWeight="medium">{`comment - ${
          comment.chain || comment.community
        }`}</CWText>
        <CWText className="search-results-thread-title">
          {renderTruncatedHighlights(
            searchTerm,
            decodeURIComponent(comment.title)
          )}
        </CWText>
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
          <QuillRenderer
            hideFormatting={true}
            doc={comment.text}
            searchTerm={searchTerm}
          />
          ;
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
      setRoute(params.community.id ? `/${params.community.id}` : '/', {}, null);
    } else {
      setRoute(community.id ? `/${community.id}` : '/', {}, null);
    }
  };

  return (
    <div
      key={community?.id}
      className="community-result-row"
      onClick={onSelect}
    >
      <CommunityLabel {...params} />
    </div>
  );
};

const getMemberResult = (addr) => {
  const profile: Profile = app.newProfiles.getProfile(addr.chain, addr.address);
  if (addr.name) {
    profile.initialize(addr.name, null, null, null, null, null);
  }

  if (app.isCustomDomain() && app.customDomainId() !== addr.chain) return;

  return (
    <div key={profile.id} className="member-result-row">
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

export const getListing = (
  results: any,
  searchTerm: string,
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
    .slice(0, 50);

  return tabScopedResults;
};
