import moment from 'moment';
import React, { FC } from 'react';

import { useCommonNavigate } from '../../../../../navigation/helpers';
import { ThreadResult } from '../../../../pages/search/helpers';
import { renderTruncatedHighlights } from '../../../react_quill_editor/highlighter';
import { User } from '../../../user/user';
import { CWText } from '../../cw_text';

import { getDecodedString } from '@hicommonwealth/shared';
// eslint-disable-next-line max-len
import { MarkdownHitHighlighterWithFallback } from 'views/components/MarkdownHitHighlighterWithFallback/MarkdownHitHighlighterWithFallback';
import './SearchBarThreadPreviewRow.scss';

interface SearchBarThreadPreviewRowProps {
  searchResult: ThreadResult;
  searchTerm?: string;
  onSearchItemClick?: () => void;
}

export const SearchBarThreadPreviewRow: FC<SearchBarThreadPreviewRowProps> = ({
  searchResult,
  searchTerm,
  onSearchItemClick,
}) => {
  const navigate = useCommonNavigate();

  const title = getDecodedString(searchResult.title);
  const content = getDecodedString(searchResult.body);

  const handleClick = () => {
    const path = `/${searchResult.community_id}/discussion/${searchResult.id}`;
    navigate(path, {}, null);
    onSearchItemClick?.();
  };

  return (
    <div className="SearchBarThreadPreviewRow" onClick={handleClick}>
      <div className="header-row">
        <User
          userCommunityId={searchResult?.community_id}
          userAddress={searchResult?.address}
          shouldShowAsDeleted={
            !searchResult?.community_id && !searchResult?.address
          }
        />
        <CWText className="last-updated-text">•</CWText>
        <CWText type="caption" className="last-updated-text">
          {moment(searchResult.created_at).format('l')}
        </CWText>
      </div>

      <div className="content-row">
        <CWText type="b2" fontWeight="bold">
          {/* @ts-expect-error StrictNullChecks*/}
          {renderTruncatedHighlights(searchTerm, title)}
        </CWText>
        <CWText type="caption" className="excerpt-text" fontWeight="medium">
          <MarkdownHitHighlighterWithFallback
            markdown={content}
            searchTerm={searchTerm ?? ''}
            className="SearchQuillRenderer"
          />
        </CWText>
      </div>
    </div>
  );
};
