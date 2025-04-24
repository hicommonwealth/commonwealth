import type { EventStreamItemSchema } from '@hicommonwealth/schemas';
import React from 'react';
import { Link } from 'react-router-dom';
import type { z } from 'zod';
import { formatAddressShort } from '../../../helpers';
import EventIcon from './EventIcon';
import './EventItem.scss';
import { EventTextPart, getEventText } from './utils';
interface EventItemProps {
  type: string;
  data: z.infer<typeof EventStreamItemSchema>['data'];
  url: string;
}

const EventItem = ({ type, data, url }: EventItemProps) => {
  const authorAddress = data.created_by || data.address || data.user_address;
  const formattedAddress = formatAddressShort(authorAddress || '');
  const eventTextResult = getEventText(type, data);

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

  // Helper to render parts
  const renderTextParts = (parts: EventTextPart[]) => {
    return parts.map((part, index) =>
      part.type === 'strong' ? (
        <strong key={index}>{part.content}</strong>
      ) : (
        <span key={index}>{part.content}</span>
      ),
    );
  };

  return (
    <Link to={url} className="EventItem">
      <div className="event-icon">
        <EventIcon type={type} imageUrl={imageUrl} />
      </div>
      <div className="event-left-content">
        <div className="event-primary-line">
          {renderTextParts(eventTextResult.primary)}
        </div>
        {eventTextResult.secondary.length > 0 && (
          <div className="event-secondary-line">
            {renderTextParts(eventTextResult.secondary)}
          </div>
        )}
      </div>
    </Link>
  );
};

export default EventItem;
