import {
  Certificate,
  Chat,
  Clock,
  Fire,
  House,
  IconWeight,
} from '@phosphor-icons/react';
import React from 'react';

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

export default EventIcon;
