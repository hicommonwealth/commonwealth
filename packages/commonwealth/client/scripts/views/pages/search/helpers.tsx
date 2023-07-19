import React from 'react';
import moment from 'moment';

import 'pages/search/index.scss';

import NewProfilesController from '../../../controllers/server/newProfiles';
import type MinimumProfile from '../../../models/MinimumProfile';
import app from 'state';
import { SearchContentType } from 'types';
import { SearchScope } from '../../../models/SearchQuery';
import AddressInfo from '../../../models/AddressInfo';
import { CommunityLabel } from '../../components/community_label';
import { CWIcon } from '../../components/component_kit/cw_icons/cw_icon';
import { CWText } from '../../components/component_kit/cw_text';
import { User } from '../../components/user/user';
import { QuillRenderer } from '../../components/react_quill_editor/quill_renderer';
import { renderTruncatedHighlights } from '../../components/react_quill_editor/highlighter';

type ThreadResult = {
  id: number;
  chain: string;
  title: string;
  body: string;
  address_id: number;
  address: string;
  address_chain: string;
  created_at: string;
};
const renderThreadResult = (thread: ThreadResult, searchTerm, setRoute) => {
  let title = '';
  try {
    title = decodeURIComponent(thread.title);
  } catch (err) {
    title = thread.title;
  }

  const handleClick = () => {
    setRoute(`/discussion/${thread.id}`, {}, thread.chain);
  };

  if (app.isCustomDomain() && app.customDomainId() !== thread.chain) {
    return;
  }

  return (
    <div key={thread.id} className="search-result-row" onClick={handleClick}>
      <CWIcon iconName="feedback" />
      <div className="inner-container">
        <CWText fontStyle="uppercase" type="caption" className="thread-header">
          {`discussion - ${thread.chain}`}
        </CWText>
        <CWText className="search-results-thread-title" fontWeight="medium">
          {renderTruncatedHighlights(searchTerm, title)}
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
        <CWText>
          <QuillRenderer
            containerClass="SearchQuillRenderer"
            hideFormatting={true}
            doc={thread.body}
            searchTerm={searchTerm}
          />
        </CWText>
      </div>
    </div>
  );
};

type ReplyResult = {
  id: number;
  proposalid: number;
  chain: string;
  community: string;
  title: string;
  text: string;
  address_id: number;
  address: string;
  address_chain: string;
  created_at: string;
};
const renderReplyResult = (comment: ReplyResult, searchTerm, setRoute) => {
  const proposalId = comment.proposalid;
  const chain = comment.chain;

  const handleClick = () => {
    setRoute(`/discussion/${proposalId}?comment=${comment.id}`, {}, chain);
  };

  if (app.isCustomDomain() && app.customDomainId() !== chain) return;

  return (
    <div key={comment.id} className="search-result-row" onClick={handleClick}>
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
        <CWText>
          <QuillRenderer
            containerClass="SearchQuillRenderer"
            hideFormatting={true}
            doc={comment.text}
            searchTerm={searchTerm}
          />
        </CWText>
      </div>
    </div>
  );
};

/**
 *  This function sets the route to go to the search result (i.e. a community).
 *  At this point the route is /:scope/search where :scope is the current community id.
 *  The route should be set to /<community-id>, so null should be passed instead of a prefix,
 *  as defined in the useCommonNavigate hook and the getScopePrefix helper function.
 */
type CommunityResult = {
  SearchContentType: SearchContentType;
  id: any;
};
const renderCommunityResult = (community: CommunityResult, setRoute) => {
  const params =
    community.SearchContentType === SearchContentType.Token
      ? { community }
      : community.SearchContentType === SearchContentType.Chain
      ? { community }
      : null;

  const handleClick = () => {
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
      onClick={handleClick}
    >
      <CommunityLabel {...params} />
    </div>
  );
};

type MemberResult = {
  chain: string;
  address: string;
};
const getMemberResult = (addr: MemberResult, setRoute) => {
  const profile: MinimumProfile = NewProfilesController.Instance.getProfile(
    addr.chain,
    addr.address
  );

  const handleClick = () => {
    setRoute(`/profile/id/${profile.id}`, {}, null);
  };

  if (app.isCustomDomain() && app.customDomainId() !== addr.chain) {
    return null;
  }

  return (
    <div key={profile.id} className="member-result-row" onClick={handleClick}>
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

export const renderSearchResults = (
  results: any[],
  searchTerm: string,
  searchType: SearchScope,
  setRoute: any
) => {
  if (!results || results.length === 0) {
    return [];
  }
  const components = results.map((res) => {
    switch (searchType) {
      case SearchScope.Threads:
        return renderThreadResult(res as ThreadResult, searchTerm, setRoute);
      case SearchScope.Members:
        return getMemberResult(res as MemberResult, setRoute);
      case SearchScope.Communities:
        return renderCommunityResult(res as CommunityResult, setRoute);
      case SearchScope.Replies:
        return renderReplyResult(res as ReplyResult, searchTerm, setRoute);
      default:
        return <>ERROR</>;
    }
  });
  return components;
};
