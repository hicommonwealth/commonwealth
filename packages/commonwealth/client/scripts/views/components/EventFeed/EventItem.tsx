import type { EventStreamItemSchema } from '@hicommonwealth/schemas';
import React from 'react';
import { Link } from 'react-router-dom';
import type { z } from 'zod';
import EventIcon from './EventIcon';

const formatAddress = (address: string | null | undefined): string => {
  if (!address) return 'Anonymous';
  if (address.length <= 10) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

const getEventText = (
  type: string,
  data: z.infer<typeof EventStreamItemSchema>['data'],
): JSX.Element[] => {
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
        <strong key="title">&ldquo;{data.title}&rdquo;</strong>,
        <span key="in"> in </span>,
        <strong key="community">{communityName}</strong>,
      ];
    default:
      return [<span key="default">New activity</span>];
  }
};

const EventItem: React.FC<{
  type: string;
  data: z.infer<typeof EventStreamItemSchema>['data'];
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
        return data.image_url || data.icon_url;
      case 'CommunityCreated':
        return data.icon_url;
      case 'ThreadCreated':
        return data.community_icon || data.profile_avatar;
      default:
        return undefined;
    }
  })();

  return (
    <Link to={url} className="event-item">
      <div className="event-content">
        <span className="event-address">{formattedAddress}</span>
        {eventText}
      </div>
      <div className="event-icon">
        <EventIcon type={type} imageUrl={imageUrl} />
      </div>
    </Link>
  );
};

export default EventItem;
