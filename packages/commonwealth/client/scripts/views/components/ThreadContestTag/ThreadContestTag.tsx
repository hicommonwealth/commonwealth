import React from 'react';

import { CWText } from 'views/components/component_kit/cw_text';
import CWPopover, {
  usePopover,
} from 'views/components/component_kit/new_designs/CWPopover';
import { CWTag } from 'views/components/component_kit/new_designs/CWTag';

import './ThreadContestTag.scss';

interface ThreadContestTagProps {
  date: string;
  isRecurring: boolean;
  round?: number;
}

const ThreadContestTag = ({
  date,
  isRecurring,
  round,
}: ThreadContestTagProps) => {
  const popoverProps = usePopover();

  return (
    <div className="ThreadContestTag">
      <CWTag
        label="1st"
        type="contest"
        classNames="prize-1"
        onMouseEnter={popoverProps.handleInteraction}
        onMouseLeave={popoverProps.handleInteraction}
      />
      <CWPopover
        className="contest-popover"
        title="Contest Title"
        body={
          <div>
            <CWText>{date}</CWText>
            {isRecurring && <CWText>Round {round}</CWText>}
          </div>
        }
        {...popoverProps}
      />
    </div>
  );
};

export default ThreadContestTag;
