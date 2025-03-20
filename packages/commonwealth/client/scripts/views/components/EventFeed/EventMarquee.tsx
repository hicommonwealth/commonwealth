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

const EventItem: React.FC<{
  type: string;
  data: any;
  url: string;
}> = ({ type, data, url }) => {
  let text = '';

  switch (type) {
    case 'ContestStarted':
      text = `Contest started: ${data.title}`;
      break;
    case 'ContestEnding':
      text = `Contest ending soon: ${data.title}`;
      break;
    case 'ContestEnded':
      text = `Contest ended: ${data.title}`;
      break;
    case 'CommunityCreated':
      text = `New community: ${data.name}`;
      break;
    case 'ThreadCreated':
      text = `New thread: ${data.title}`;
      break;
    default:
      text = 'New activity';
  }

  return (
    <Link to={url} className="event-item">
      <span className="event-icon">
        <EventIcon type={type} />
      </span>
      <span className="event-link">{text}</span>
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

  // Use sticky header behavior if isSticky is true
  useStickyHeader({
    elementId,
    zIndex,
    stickyBehaviourEnabled: isSticky,
  });

  // Debug information - disabled in production
  if (process.env.NODE_ENV === 'development') {
    // Log only on significant changes to reduce console spam
    useEffect(() => {
      console.log('EventMarquee data:', data);
      console.log('EventMarquee loading:', isLoading);
      if (error) console.log('EventMarquee error:', error);
    }, [data, isLoading, error]);
  }

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

  // Always use mock data for now to ensure the banner works
  // Later this can be replaced with real data from the API
  let items = [
    {
      type: 'ThreadCreated',
      data: { title: 'Welcome to Commonwealth' },
      url: '/',
    },
    {
      type: 'CommunityCreated',
      data: { name: 'Test Community' },
      url: '/',
    },
    {
      type: 'ContestStarted',
      data: { title: 'Sample Contest' },
      url: '/',
    },
    {
      type: 'ThreadCreated',
      data: { title: 'Governance Discussion' },
      url: '/',
    },
    {
      type: 'ContestEnding',
      data: { title: 'Weekly Challenge' },
      url: '/',
    },
    {
      type: 'CommunityCreated',
      data: { name: 'DAO Enthusiasts' },
      url: '/',
    },
    {
      type: 'ContestEnded',
      data: { title: 'Hackathon Results' },
      url: '/',
    },
    {
      type: 'ThreadCreated',
      data: { title: 'Protocol Upgrade Proposal' },
      url: '/',
    },
  ];

  // Duplicate the items to create a continuous scrolling effect
  const duplicatedItems = [...items, ...items, ...items];

  return (
    <div id={elementId} className={`EventMarquee ${isSticky ? 'sticky' : ''}`}>
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
