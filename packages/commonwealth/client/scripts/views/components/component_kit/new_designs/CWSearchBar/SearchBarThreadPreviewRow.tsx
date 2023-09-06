import React, { FC } from 'react';
import moment from 'moment';

import { useCommonNavigate } from '../../../../../navigation/helpers';
import { ThreadResult } from '../../../../pages/search/helpers';
import AddressInfo from '../../../../../models/AddressInfo';
import { CWText } from '../../cw_text';
import { renderTruncatedHighlights } from '../../../react_quill_editor/highlighter';
import { QuillRenderer } from '../../../react_quill_editor/quill_renderer';
import { User } from '../../../user/user';

import './SearchBarThreadPreviewRow.scss';

interface SearchBarThreadPreviewRowProps {
  searchResult: ThreadResult;
  searchTerm?: string;
}

export const SearchBarThreadPreviewRow: FC<SearchBarThreadPreviewRowProps> = ({
  searchResult,
  searchTerm,
}) => {
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
