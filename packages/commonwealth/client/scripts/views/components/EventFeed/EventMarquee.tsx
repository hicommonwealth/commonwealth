import {
  Certificate,
  Chat,
  Clock,
  Fire,
  House,
  IconWeight,
} from '@phosphor-icons/react';
import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import useStickyHeader from '../../../hooks/useStickyHeader';
import { useFetchEventStreamQuery } from '../../../state/api/feeds/eventStream';
import './EventMarquee.scss';

interface EventIconProps {
  type: string;
}

const EventIcon: React.FC<EventIconProps> = ({ type }) => {
  const iconProps = { size: 16, weight: 'bold' as IconWeight };

  switch (type) {
    case 'ContestStarted':
      return <Fire color="white" {...iconProps} />;
    case 'ContestEnding':
      return <Clock color="white" {...iconProps} />;
    case 'ContestEnded':
      return <Certificate color="white" {...iconProps} />;
    case 'CommunityCreated':
      return <House color="white" {...iconProps} />;
    case 'ThreadCreated':
      return <Chat color="white" {...iconProps} />;
    default:
      return <Chat color="white" {...iconProps} />;
  }
};

const formatAddress = (address: string | null | undefined): string => {
  if (!address) return 'Anonymous';
  if (address.length <= 10) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

const getEventText = (type: string, data: any): string => {
  switch (type) {
    case 'ContestStarted':
      return `created contest: ${data.name || data.title}`;
    case 'ContestEnding':
      return `contest ending soon: ${data.name || data.title}`;
    case 'ContestEnded':
      return `contest ended: ${data.name || data.title}`;
    case 'CommunityCreated':
      return `created new community: ${data.name}`;
    case 'ThreadCreated':
      return `posted new thread: ${data.title}`;
    default:
      return 'New activity';
  }
};

const EventItem: React.FC<{
  type: string;
  data: any;
  url: string;
}> = ({ type, data, url }) => {
  const authorAddress = data.created_by || data.address || data.user_address;
  const formattedAddress = formatAddress(authorAddress);
  const eventText = getEventText(type, data);

  return (
    <Link to={url} className="event-item">
      <span className="event-icon">
        <EventIcon type={type} />
      </span>
      <span className="event-author">{formattedAddress}</span>
      <span className="event-text">{eventText}</span>
      <span className="event-link-indicator">→</span>
    </Link>
  );
};

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
  const { data, isLoading, error } = useFetchEventStreamQuery();

  // Debug information - disabled in production
  useEffect(() => {
    console.log('EventMarquee Debug:', {
      isLoading,
      hasData: !!data,
      error,
      items: data?.pages?.flatMap((page) => page.items) || [],
      elementId,
      isSticky,
      zIndex,
    });
  }, [data, isLoading, error, elementId, isSticky, zIndex]);

  // Use sticky header behavior if isSticky is true
  useStickyHeader({
    elementId,
    zIndex,
    stickyBehaviourEnabled: isSticky,
  });

  // Always render the component, even if there's no data yet
  if (isLoading) {
    return (
      <div
        id={elementId}
        className={`EventMarquee ${isSticky ? 'sticky' : ''}`}
        style={{ justifyContent: 'center' }}
      >
        <div>Loading event feed...</div>
      </div>
    );
  }

  // Get all items from all pages
  const items = data?.pages?.flatMap((page) => page.items) || [];

  // If no items, show a placeholder
  if (items.length === 0) {
    return (
      <div
        id={elementId}
        className={`EventMarquee ${isSticky ? 'sticky' : ''}`}
        style={{ justifyContent: 'center' }}
      >
        <div>No recent activity</div>
      </div>
    );
  }

  // Duplicate the items to create a continuous scrolling effect
  const duplicatedItems = [...items, ...items, ...items];

  return (
    <div
      id={elementId}
      className={`EventMarquee ${isSticky ? 'sticky' : ''}`}
      style={{
        display: 'block', // Ensure it's displayed
        visibility: 'visible', // Ensure it's visible
      }}
    >
      <div className="event-content">
        {duplicatedItems.map((event, i) => (
          <EventItem
            key={`${event.type}-${i}`}
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
