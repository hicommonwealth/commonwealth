import React from 'react';

import moment from 'moment';

import 'pages/search/search_bar_components.scss';

import NewProfilesController from '../../../controllers/server/newProfiles';
import AddressInfo from '../../../models/AddressInfo';
import ChainInfo from '../../../models/ChainInfo';
import { CommunityLabel } from '../../components/community_label';
import { CWText } from '../../components/component_kit/cw_text';
import { getClasses } from '../../components/component_kit/helpers';
import { User } from '../../components/user/user';
import { useCommonNavigate } from 'navigation/helpers';
import { QuillRenderer } from '../../components/react_quill_editor/quill_renderer';
import { renderTruncatedHighlights } from '../../components/react_quill_editor/highlighter';
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

type SearchBarThreadPreviewRowProps = {
  searchResult: ThreadResult;
  searchTerm?: string;
};
export const SearchBarThreadPreviewRow = (
  props: SearchBarThreadPreviewRowProps
) => {
  const { searchResult, searchTerm } = props;
  const navigate = useCommonNavigate();

  const title = decodeURIComponent(searchResult.title);
  const content = decodeURIComponent(searchResult.body);

  const handleClick = () => {
    const path = `/${searchResult.chain}/discussion/${searchResult.id}`;
    navigate(path, {}, null);
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
  props: SearchBarCommentPreviewRowProps
) => {
  const { searchResult, searchTerm } = props;
  const navigate = useCommonNavigate();

  const title = decodeURIComponent(searchResult.title);
  const content = searchResult.text;

  const handleClick = () => {
    const path = `/${searchResult.chain}/discussion/${searchResult.proposalid}?comment=${searchResult.id}`;
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

type SearchBarChainPreviewRowProps = {
  searchResult: CommunityResult;
  searchTerm?: string;
};
export const SearchBarCommunityPreviewRow = (
  props: SearchBarChainPreviewRowProps
) => {
  const { searchResult } = props;
  const navigate = useCommonNavigate();

  const handleClick = () => {
    navigate(`/${searchResult.id}`, {}, null);
  };

  const chainInfo = ChainInfo.fromJSON(searchResult as any);

  return (
    <div className="SearchBarCommunityPreviewRow" onClick={handleClick}>
      <CommunityLabel community={chainInfo} />
    </div>
  );
};

type SearchBarMemberPreviewRowProps = {
  searchResult: MemberResult;
  searchTerm?: string;
};
export const SearchBarMemberPreviewRow = (
  props: SearchBarMemberPreviewRowProps
) => {
  const { searchResult } = props;
  const chain = searchResult.chains[0];
  const address = searchResult.addresses[0];

  const navigate = useCommonNavigate();

  const handleClick = () => {
    navigate(`/profile/id/${searchResult.id}`, {}, null);
  };

  return (
    <div className="SearchBarMemberPreviewRow" onClick={handleClick}>
      <User
        user={NewProfilesController.Instance.getProfile(chain, address)}
        linkify
      />
    </div>
  );
};
