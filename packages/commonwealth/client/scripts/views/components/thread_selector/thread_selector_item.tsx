import React from 'react';
import type Thread from '../../../models/Thread';
import app from 'state';
import { CWCheck } from 'views/components/component_kit/cw_icons/cw_icons';
import { CWText } from 'views/components/component_kit/cw_text';
import { formatAddressShort } from 'utils';

interface ThreadSelectorItemProps {
  thread: Thread;
  onClick: (thread: Thread) => void;
  isSelected: boolean;
}

export const ThreadSelectorItem = ({
  thread,
  onClick,
  isSelected,
}: ThreadSelectorItemProps) => {
  const author = app.newProfiles.getProfile(thread.authorChain, thread.author);

  return (
    <div className="thread-selector-item-row" onClick={() => onClick(thread)}>
      <div className="selected">{isSelected && <CWCheck />}</div>
      <div>
        <CWText fontWeight="medium" noWrap>
          {thread.title}
        </CWText>
        <CWText type="caption">
          {author.name
            ? `${author.name} • ${formatAddressShort(thread.author)}`
            : thread.author}
        </CWText>
      </div>
    </div>
  );
};
