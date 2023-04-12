import React from 'react';

import { AddressInfo } from 'models';
import moment from 'moment';

import 'pages/search/search_bar_components.scss';

import app from 'state';
import { CommunityLabel } from '../../components/community_label';
import { CWText } from '../../components/component_kit/cw_text';
import { getClasses } from '../../components/component_kit/helpers';
import { User } from '../../components/user/user';
import { useCommonNavigate } from 'navigation/helpers';
import { QuillRenderer } from '../../components/react_quill_editor/quill_renderer';
import { renderTruncatedHighlights } from '../../components/react_quill_editor/highlighter';

type SearchChipProps = {
  isActive: boolean;
  label: string;
  onClick: () => void;
};

export const SearchChip = (props: SearchChipProps) => {
  const { isActive, label, onClick } = props;

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
      onClick={onClick}
    >
      {label}
    </CWText>
  );
};

type SearchBarPreviewRowProps = {
  searchResult: {
    address_id: number;
    address: string;
    address_chain: string;
    proposalid: string;
    title: string;
    body?: string;
    text?: string;
    chain?: string;
    created_at: string;
  };
  searchTerm?: string;
};

export const SearchBarThreadPreviewRow = (props: SearchBarPreviewRowProps) => {
  const { searchResult, searchTerm } = props;
  const navigate = useCommonNavigate();

  const title = decodeURIComponent(searchResult.title);
  const content = decodeURIComponent(searchResult.body);

  const handleClick = () => {
    const path = `/discussion/${searchResult.proposalid}`;
    navigate(path);
  };

  return (
    <div className="SearchBarThreadPreviewRow" onClick={handleClick}>
      <div className="header-row">
        <User
          user={
            new AddressInfo(
              searchResult.address_id,
              searchResult.address,
              searchResult.address_chain,
              null
            )
          }
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
        />
      </CWText>
    </div>
  );
};

export const SearchBarCommentPreviewRow = (props: SearchBarPreviewRowProps) => {
  const { searchResult, searchTerm } = props;
  const navigate = useCommonNavigate();

  const title = decodeURIComponent(searchResult.title);
  const content = searchResult.text;

  const handleClick = () => {
    const path = `/discussion/${searchResult.proposalid}`;
    navigate(path);
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
        />
      </CWText>
    </div>
  );
};

export const SearchBarCommunityPreviewRow = (
  props: SearchBarPreviewRowProps
) => {
  const { searchResult } = props;
  const navigate = useCommonNavigate();

  return (
    <div
      className="SearchBarCommunityPreviewRow"
      onClick={() => {
        navigate(
          searchResult.address
            ? `/${searchResult.address}`
            : searchResult.id
            ? `/${searchResult.id}`
            : '/'
        );
      }}
    >
      <CommunityLabel community={searchResult} />
    </div>
  );
};

export const SearchBarMemberPreviewRow = (props: SearchBarPreviewRowProps) => {
  const { searchResult } = props;

  return (
    <div className="SearchBarMemberPreviewRow">
      <User
        user={app.newProfiles.getProfile(
          searchResult.chain,
          searchResult.address
        )}
        linkify
      />
    </div>
  );
};
