import React from 'react';

import clsx from 'clsx';
import { CWIcon } from '../component_kit/cw_icons/cw_icon';
import { IconName } from '../component_kit/cw_icons/cw_icon_lookup';
import { CWText } from '../component_kit/cw_text';
import './Timeline.scss';
const getTimelineEvents = (proposalData: any) => {
  return [
    {
      date: formatDate(proposalData?.submitTime),
      title: 'Proposal Published',
      type: 'past',
      iconName: 'plusCirclePhosphor',
    },
    {
      date: formatDate(proposalData?.votingStartTime),
      title: 'Voting Begins',
      type: 'active',
      iconName: 'vector',
    },
    {
      date: formatDate(proposalData?.votingEndTime),
      title: 'Voting Ends',
      type: 'coming',
      iconName: 'infoEmpty',
    },
  ];
};

const formatDate = (isoString: string) => {
  return new Date(isoString).toLocaleDateString('en-GB'); // Format: DD/MM/YYYY
};
const TimeLine = ({ proposalData }: { proposalData: any }) => {
  const timelineEvents = getTimelineEvents(proposalData);
  return (
    <div className="TimeLine">
      <div className="header">
        <CWText type="h5" fontWeight="semiBold">
          TimeLine
        </CWText>
      </div>
      <div className="rb-container">
        <ul className="rb">
          {timelineEvents.map((event, index) => (
            <li
              key={index}
              className={`rb-item ${index === timelineEvents.length - 1 ? 'last-item' : ''}`}
            >
              <div className="timeline-dot">
                <CWIcon
                  className={event.type}
                  iconName={event.iconName as IconName}
                  iconSize="large"
                  fill="red"
                />
              </div>
              <div className="timestamp">
                <CWText type="h5" fontWeight="regular">
                  {event.date}
                </CWText>
              </div>
              <div className={clsx('item-title', event.type)}>
                <CWText type="b2" fontWeight="regular" className={event.type}>
                  {event.title}
                </CWText>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default TimeLine;
