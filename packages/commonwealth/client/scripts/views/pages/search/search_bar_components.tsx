import React from 'react';

import { AddressInfo } from 'models';
import moment from 'moment';

import 'pages/search/search_bar_components.scss';

import app from 'state';
import { CommunityLabel } from '../../components/community_label';
import { CWText } from '../../components/component_kit/cw_text';
import { getClasses } from '../../components/component_kit/helpers';
import { renderQuillTextBody } from '../../components/quill/helpers';
import { User } from '../../components/user/user';
import { useCommonNavigate } from 'navigation/helpers';

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
  searchResult: any;
  searchTerm?: string;
};

export const SearchBarThreadPreviewRow = (props: SearchBarPreviewRowProps) => {
  const { searchResult, searchTerm } = props;
  const navigate = useCommonNavigate();

  return (
    <div
      className="SearchBarThreadPreviewRow"
      onClick={() => navigate(`/discussion/${searchResult.proposalid}`)}
    >
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
        {decodeURIComponent(searchResult.title)}
      </CWText>
      <CWText type="caption" className="excerpt-text" fontWeight="medium">
        {renderQuillTextBody(searchResult.body, {
          hideFormatting: true,
          searchTerm,
        })}
      </CWText>
    </div>
  );
};

export const SearchBarCommentPreviewRow = (props: SearchBarPreviewRowProps) => {
  const { searchResult, searchTerm } = props;
  const navigate = useCommonNavigate();

  return (
    <div
      className="SearchBarCommentPreviewRow"
      onClick={() => {
        navigate(
          `/${searchResult.proposalid.split('_')[0]}/${
            searchResult.proposalid.split('_')[1]
          }`
        );
      }}
    >
      <CWText type="caption" className="last-updated-text">
        {moment(searchResult.created_at).format('l')}
      </CWText>
      {/* <CWText type="caption">{searchResult.chain}</CWText> */}
      {/* <CWText type="b2" fontWeight="medium">
          {decodeURIComponent(searchResult.title)}
        </CWText> */}
      <CWText type="caption" className="excerpt-text">
        {renderQuillTextBody(searchResult.text, {
          hideFormatting: true,
          searchTerm,
        })}
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
