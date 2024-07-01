import moment from 'moment';
import React from 'react';

import { CWText } from 'views/components/component_kit/cw_text';
import CWPopover, {
  usePopover,
} from 'views/components/component_kit/new_designs/CWPopover';
import { CWTag } from 'views/components/component_kit/new_designs/CWTag';

import './ThreadContestTag.scss';

interface ThreadContestTagProps {
  date: string;
  round: number | null;
  title: string;
  prize: number;
}

const ThreadContestTag = ({
  date,
  round,
  title,
  prize,
}: ThreadContestTagProps) => {
  const popoverProps = usePopover();

  return (
    <div className="ThreadContestTag">
      <CWTag
        label={moment.localeData().ordinal(prize)}
        type="contest"
        classNames={`prize-${prize}`}
        // @ts-expect-error <StrictNullChecks/>
        onMouseEnter={popoverProps.handleInteraction}
        onMouseLeave={popoverProps.handleInteraction}
      />
      <CWPopover
        className="contest-popover"
        title={title}
        body={
          <div>
            <CWText>{date}</CWText>
            {round && <CWText>Round {round}</CWText>}
          </div>
        }
        {...popoverProps}
      />
    </div>
  );
};

export default ThreadContestTag;
