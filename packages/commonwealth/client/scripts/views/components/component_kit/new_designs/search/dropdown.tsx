import React, { FC } from 'react';
import moment from 'moment';

import NewProfilesController from '../../../../../controllers/server/newProfiles';
import AddressInfo from '../../../../../models/AddressInfo';
import ChainInfo from '../../../../../models/ChainInfo';
import { SearchScope } from '../../../../../models/SearchQuery';
import { useCommonNavigate } from 'navigation/helpers';
import { CommunityLabel } from '../../../community_label';
import { CWText } from '../../cw_text';
import { User } from '../../../user/user';
import { QuillRenderer } from '../../../react_quill_editor/quill_renderer';
import { renderTruncatedHighlights } from '../../../react_quill_editor/highlighter';
import { CWDivider } from '../../cw_divider';
import {
  CommunityResult,
  MemberResult,
  ReplyResult,
  ThreadResult,
} from '../../../../pages/search/helpers';

import '../../../../../../styles/components/component_kit/new_designs/CWSearchBar.scss';

type SearchBarThreadPreviewRowProps = {
  searchResult: ThreadResult;
  searchTerm?: string;
};

type SearchBarCommentPreviewRowProps = {
  searchResult: ReplyResult;
  searchTerm?: string;
};

type SearchBarChainPreviewRowProps = {
  searchResult: CommunityResult;
  searchTerm?: string;
};

type SearchBarMemberPreviewRowProps = {
  searchResult: MemberResult;
  searchTerm?: string;
};

type SearchBarPreviewSectionProps = {
  searchResults: any;
  searchTerm: string;
  searchScope: SearchScope;
};

type SearchBarDropdownProps = {
  searchTerm: string;
  searchResults: any;
};

const SearchBarThreadPreviewRow = (props: SearchBarThreadPreviewRowProps) => {
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

const SearchBarCommentPreviewRow = (props: SearchBarCommentPreviewRowProps) => {
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

const SearchBarCommunityPreviewRow = (props: SearchBarChainPreviewRowProps) => {
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

const SearchBarMemberPreviewRow = (props: SearchBarMemberPreviewRowProps) => {
  const { searchResult } = props;
  const chain = searchResult.addresses[0].chain;
  const address = searchResult.addresses[0].address;

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

const SearchBarPreviewSection: FC<SearchBarPreviewSectionProps> = ({
  searchResults,
  searchTerm,
  searchScope,
}) => {
  const sectionTitles = {
    [SearchScope.Threads]: 'Threads',
    [SearchScope.Replies]: 'Comments',
    [SearchScope.Communities]: 'Communities',
    [SearchScope.Members]: 'Members',
  };

  const PreviewRowComponentMap = {
    [SearchScope.Threads]: SearchBarThreadPreviewRow,
    [SearchScope.Replies]: SearchBarCommentPreviewRow,
    [SearchScope.Communities]: SearchBarCommunityPreviewRow,
    [SearchScope.Members]: SearchBarMemberPreviewRow,
  };

  const PreviewRowComponent = PreviewRowComponentMap[searchScope];

  if (!PreviewRowComponent || searchResults.length === 0) {
    return null;
  }

  return (
    <div className="preview-section">
      <div className="section-header">
        <CWText type="caption" className="section-header-text">
          {sectionTitles[searchScope]}
        </CWText>
        <CWDivider />
      </div>
      {searchResults.map((res: any, i: number) => (
        <PreviewRowComponent
          key={i}
          searchResult={res}
          searchTerm={searchTerm}
        />
      ))}
    </div>
  );
};

export const SearchBarDropdown: FC<SearchBarDropdownProps> = ({
  searchTerm,
  searchResults,
}) => {
  const showResults =
    searchTerm.length > 0 && Object.values(searchResults).flat(1).length > 0;

  return (
    <div className="ListBox">
      {showResults ? (
        <div className="previews-section">
          {Object.entries(searchResults).map(([scope, results]) => (
            <SearchBarPreviewSection
              key={scope}
              searchResults={results}
              searchTerm={searchTerm}
              searchScope={scope as SearchScope}
            />
          ))}
        </div>
      ) : (
        <div className="no-results">
          <CWText type="b2">No results found</CWText>
        </div>
      )}
    </div>
  );
};
