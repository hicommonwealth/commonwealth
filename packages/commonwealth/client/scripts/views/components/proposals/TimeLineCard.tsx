import React, { useState } from 'react';

import { SnapshotProposal } from 'client/scripts/helpers/snapshot_utils';
import { AnyProposal } from 'client/scripts/models/types';
import clsx from 'clsx';
import { CWIcon } from '../component_kit/cw_icons/cw_icon';
import { IconName } from '../component_kit/cw_icons/cw_icon_lookup';
import { CWText } from '../component_kit/cw_text';
import './TimeLineCard.scss';
import { getTimelineEvents } from './utils';

const TimeLineCard = ({
  proposalData,
}: {
  proposalData: SnapshotProposal | AnyProposal;
}) => {
  const timelineEvents = getTimelineEvents(proposalData);
  const [isCollapsed, setIsCollapsed] = useState(false);
  return (
    <div className={clsx('TimeLineCard', { isCollapsed: isCollapsed })}>
      <div className="timeline-header">
        <CWText type="h5" fontWeight="semiBold">
          Timeline
        </CWText>
        <CWIcon
          iconName={isCollapsed ? 'caretDown' : 'caretUp'}
          iconSize="small"
          className="caret-icon"
          weight="bold"
          onClick={() => setIsCollapsed(!isCollapsed)}
        />
      </div>
      {!isCollapsed && (
        <div className="rb-container">
          <ul className="rb">
            {timelineEvents.map((event, index) => (
              <li
                key={index}
                className={`rb-item ${index === timelineEvents.length - 1 ? 'last_item' : ''}`}
              >
                <div
                  className={clsx('timeline-dot', {
                    last_item: index === timelineEvents.length - 1,
                    active: event.type === 'active',
                  })}
                >
                  <CWIcon
                    className={event.type}
                    iconName={event.iconName as IconName}
                    iconSize="large"
                  />
                </div>
                <div className="right-container">
                  <div className="timestamp">
                    <CWText type="h5" fontWeight="regular">
                      {event.date}
                    </CWText>
                  </div>
                  <div className={clsx('item-title', event.type)}>
                    <CWText
                      type="b2"
                      fontWeight="regular"
                      className={event.type}
                    >
                      {event.title}
                    </CWText>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default TimeLineCard;
