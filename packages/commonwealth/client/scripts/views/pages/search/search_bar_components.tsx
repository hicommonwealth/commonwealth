import React from 'react';

import moment from 'moment';

import 'pages/search/search_bar_components.scss';

import { useCommonNavigate } from 'navigation/helpers';
import CommunityInfo from '../../../models/ChainInfo';
import { CommunityLabel } from '../../components/community_label';
import { CWText } from '../../components/component_kit/cw_text';
import { getClasses } from '../../components/component_kit/helpers';
import { renderTruncatedHighlights } from '../../components/react_quill_editor/highlighter';
import { QuillRenderer } from '../../components/react_quill_editor/quill_renderer';
import { User } from '../../components/user/user';
import {
  CommunityResult,
  MemberResult,
  ReplyResult,
  ThreadResult,
} from './helpers';

type SearchChipProps = {
  isActive: boolean;
  label: string;
  onClick: () => void;
};

export const SearchChip = ({ isActive, label, onClick }: SearchChipProps) => {
  return (
    <CWText
      type="b2"
      fontWeight="medium"
      className={getClasses<{ isActive: boolean }>(
        {
          isActive,
        },
        'SearchChip',
      )}
      onClick={onClick}
    >
      {label}
    </CWText>
  );
};

type SearchBarThreadPreviewRowProps = {
  searchResult: ThreadResult;
  searchTerm?: string;
};
export const SearchBarThreadPreviewRow = ({
  searchResult,
  searchTerm,
}: SearchBarThreadPreviewRowProps) => {
  const navigate = useCommonNavigate();

  const title = decodeURIComponent(searchResult.title);
  const content = decodeURIComponent(searchResult.body);

  const handleClick = () => {
    const path = `/${searchResult.community}/discussion/${searchResult.id}`;
    navigate(path, {}, null);
  };

  return (
    <div className="SearchBarThreadPreviewRow" onClick={handleClick}>
      <div className="header-row">
        <User
          userAddress={searchResult.address}
          userCommunityId={searchResult.address_chain}
        />
        <CWText className="last-updated-text">•</CWText>
        <CWText type="caption" className="last-updated-text">
          {moment(searchResult.created_at).format('l')}
        </CWText>
        {/* <CWText type="caption">{searchResult.chain}</CWText> */}
      </div>
      <CWText type="b2" fontWeight="bold">
        {renderTruncatedHighlights(searchTerm, title)}
      </CWText>
      <CWText type="caption" className="excerpt-text" fontWeight="medium">
        <QuillRenderer
          hideFormatting={true}
          doc={content}
          searchTerm={searchTerm}
          containerClass="SearchQuillRenderer"
        />
      </CWText>
    </div>
  );
};

type SearchBarCommentPreviewRowProps = {
  searchResult: ReplyResult;
  searchTerm?: string;
};
export const SearchBarCommentPreviewRow = (
  props: SearchBarCommentPreviewRowProps,
) => {
  const { searchResult, searchTerm } = props;
  const navigate = useCommonNavigate();

  const title = decodeURIComponent(searchResult.title);
  const content = searchResult.text;

  const handleClick = () => {
    const path = `/${searchResult.community}/discussion/${searchResult.proposalid}?comment=${searchResult.id}`;
    navigate(path, {}, null);
  };

  return (
    <div className="SearchBarCommentPreviewRow" onClick={handleClick}>
      <CWText type="caption" className="last-updated-text">
        {moment(searchResult.created_at).format('l')}
      </CWText>
      {/* <CWText type="caption">{searchResult.chain}</CWText> */}
      <CWText type="b2" fontWeight="medium">
        {renderTruncatedHighlights(searchTerm, title)}
      </CWText>
      <CWText type="caption" className="excerpt-text">
        <QuillRenderer
          hideFormatting={true}
          doc={content}
          searchTerm={searchTerm}
          containerClass="SearchQuillRenderer"
        />
      </CWText>
    </div>
  );
};

type SearchBarCommunityPreviewRowProps = {
  searchResult: CommunityResult;
  searchTerm?: string;
};
export const SearchBarCommunityPreviewRow = (
  props: SearchBarCommunityPreviewRowProps,
) => {
  const { searchResult } = props;
  const navigate = useCommonNavigate();

  const handleClick = () => {
    navigate(`/${searchResult.id}`, {}, null);
  };

  const communityInfo = CommunityInfo.fromJSON(searchResult as any);

  return (
    <div className="SearchBarCommunityPreviewRow" onClick={handleClick}>
      <CommunityLabel community={communityInfo} />
    </div>
  );
};

type SearchBarMemberPreviewRowProps = {
  searchResult: MemberResult;
  searchTerm?: string;
};
export const SearchBarMemberPreviewRow = (
  props: SearchBarMemberPreviewRowProps,
) => {
  const { searchResult } = props;
  const community = searchResult.addresses[0].community;
  const address = searchResult.addresses[0].address;

  const navigate = useCommonNavigate();

  const handleClick = () => {
    navigate(`/profile/id/${searchResult.id}`, {}, null);
  };

  return (
    <div className="SearchBarMemberPreviewRow" onClick={handleClick}>
      <User
        userAddress={address}
        userCommunityId={community}
        shouldLinkProfile
      />
    </div>
  );
};
