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
  imageUrl?: string;
}

const EventIcon: React.FC<EventIconProps> = ({ type, imageUrl }) => {
  if (imageUrl) {
    return <img src={imageUrl} className="custom-icon" alt={type} />;
  }

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

const getEventText = (type: string, data: any): JSX.Element[] => {
  const communityName = data.community_id
    ? data.community_id.charAt(0).toUpperCase() + data.community_id.slice(1)
    : '';

  switch (type) {
    case 'ContestStarted':
      return [
        <span key="action"> created contest for </span>,
        <strong key="title">{data.name || data.title}</strong>,
      ];
    case 'ContestEnding':
      return [
        <span key="action">contest for </span>,
        <strong key="title">{data.name || data.title}</strong>,
        <span key="suffix"> ends soon</span>,
      ];
    case 'ContestEnded':
      return [
        <span key="action">contest for </span>,
        <strong key="title">{data.name || data.title}</strong>,
        <span key="suffix"> ended</span>,
      ];
    case 'CommunityCreated':
      return [
        <span key="action">created the </span>,
        <strong key="name">{data.name}</strong>,
        <span key="suffix"> space</span>,
      ];
    case 'ThreadCreated':
      return [
        <span key="action">posted </span>,
        <strong key="title">"{data.title}"</strong>,
        <span key="in"> in </span>,
        <strong key="community">{communityName}</strong>,
      ];
    default:
      return [<span key="default">New activity</span>];
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

  // Get the appropriate image URL based on event type
  const imageUrl = (() => {
    switch (type) {
      case 'ContestStarted':
      case 'ContestEnding':
      case 'ContestEnded':
        return data.image_url;
      case 'CommunityCreated':
        return data.icon_url;
      case 'ThreadCreated':
        return data.author_profile_picture;
      default:
        return undefined;
    }
  })();

  const isAuthorEvent = type === 'ThreadCreated';

  return (
    <Link
      to={url}
      className={`event-item ${isAuthorEvent ? 'author-event' : 'community-event'}`}
    >
      {isAuthorEvent && imageUrl && (
        <span className="event-icon author-icon">
          <EventIcon type={type} imageUrl={imageUrl} />
        </span>
      )}
      <strong className="event-author">{formattedAddress}</strong>
      <span className="event-text">{eventText}</span>
      {!isAuthorEvent && imageUrl && (
        <span className="event-icon community-icon">
          <EventIcon type={type} imageUrl={imageUrl} />
        </span>
      )}
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
