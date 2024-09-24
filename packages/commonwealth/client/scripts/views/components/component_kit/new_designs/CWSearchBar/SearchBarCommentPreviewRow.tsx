import moment from 'moment';
import React, { FC } from 'react';

import { useCommonNavigate } from '../../../../../navigation/helpers';
import { ReplyResult } from '../../../../pages/search/helpers';
import { renderTruncatedHighlights } from '../../../react_quill_editor/highlighter';
import { QuillRenderer } from '../../../react_quill_editor/quill_renderer';
import { CWText } from '../../cw_text';

import { getDecodedString } from '@hicommonwealth/shared';
import './SearchBarCommentPreviewRow.scss';

interface SearchBarCommentPreviewRowProps {
  searchResult: ReplyResult;
  searchTerm?: string;
  onSearchItemClick?: () => void;
}

export const SearchBarCommentPreviewRow: FC<
  SearchBarCommentPreviewRowProps
> = ({ searchResult, searchTerm, onSearchItemClick }) => {
  const navigate = useCommonNavigate();

  const title = getDecodedString(searchResult.title);
  const content = searchResult.text;

  const handleClick = () => {
    const path = `/${searchResult.community_id}/discussion/${searchResult.proposalid}?comment=${searchResult.id}`;
    navigate(path, {}, null);
    onSearchItemClick?.();
  };

  return (
    <div className="SearchBarCommentPreviewRow" onClick={handleClick}>
      <CWText type="caption" className="last-updated-text">
        {moment(searchResult.created_at).format('l')}
      </CWText>
      <CWText type="b2" fontWeight="medium">
        {/* @ts-expect-error StrictNullChecks*/}
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
