import React, { useEffect } from 'react';
import useStickyHeader from '../../../hooks/useStickyHeader';
import { useFetchEventStreamQuery } from '../../../state/api/feeds/eventStream';
import EventItem from './EventItem';
import './EventMarquee.scss';

interface EventMarqueeProps {
  isSticky?: boolean;
  zIndex?: number;
  elementId?: string;
}

const EventMarquee: React.FC<EventMarqueeProps> = ({
  isSticky = false,
  zIndex = 50,
  elementId = 'event-marquee',
}) => {
  const { data, fetchNextPage, hasNextPage } = useFetchEventStreamQuery();

  useEffect(() => {
    if (hasNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, fetchNextPage]);

  // Use sticky header behavior if isSticky is true
  useStickyHeader({
    elementId,
    zIndex,
    stickyBehaviourEnabled: isSticky,
  });

  const allEvents = data?.pages.flatMap((page) => page.items) ?? [];

  return (
    <div
      id={elementId}
      className={`event-marquee ${isSticky ? 'sticky' : ''}`}
      style={{ zIndex }}
    >
      <div className="event-marquee-content">
        {allEvents.map((event, index) => (
          <EventItem
            key={`${event.type}-${index}`}
            type={event.type}
            data={event.data}
            url={event.url}
          />
        ))}
      </div>
    </div>
  );
};

export default EventMarquee;
