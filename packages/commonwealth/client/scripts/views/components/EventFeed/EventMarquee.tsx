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
      void fetchNextPage().catch((error) => {
        console.error('Failed to fetch next page:', error);
      });
    }
  }, [hasNextPage, fetchNextPage]);

  // Use sticky header behavior if isSticky is true
  useStickyHeader({
    elementId,
    zIndex,
    stickyBehaviourEnabled: isSticky,
  });

  // START: Temporary simulation data
  const simulatedEvents = [
    {
      type: 'ContestStarted',
      data: {
        name: 'Awesome Contest',
        created_by: '0x123...abc',
        community_id: 'cool-space',
        image_url: 'https://via.placeholder.com/150/FF80D7/000000?text=Contest',
      },
      url: '/contest/1',
    },
    {
      type: 'ContestEnding',
      data: {
        name: 'Another Contest',
        user_address: '0x456...def',
        community_id: 'another-space',
        icon_url: 'https://via.placeholder.com/150/0079CC/FFFFFF?text=Ending',
      },
      url: '/contest/2',
    },
    {
      type: 'ContestEnded',
      data: {
        title: 'Past Contest',
        address: '0x789...ghi',
        community_id: 'history-space',
        image_url: 'https://via.placeholder.com/150/FF1F00/FFFFFF?text=Ended',
      },
      url: '/contest/3',
    },
    {
      type: 'CommunityCreated',
      data: {
        name: 'New Community Hub',
        created_by: '0xabc...123',
        community_id: 'new-hub',
        icon_url: 'https://via.placeholder.com/150/00FF00/000000?text=Space',
      },
      url: '/community/new-hub',
    },
    {
      type: 'ThreadCreated',
      data: {
        title: 'Important Discussion Topic',
        user_address: '0xdef...456',
        community_id: 'general-chat',
        community_icon:
          'https://via.placeholder.com/150/FFFF00/000000?text=Thread',
      },
      url: '/thread/123',
    },
    // Add more variations or real data if needed
  ];

  const allEvents = simulatedEvents; // Use simulated data for now
  // END: Temporary simulation data

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
