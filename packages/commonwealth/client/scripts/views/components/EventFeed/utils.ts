import type { EventStreamItemSchema } from '@hicommonwealth/schemas';
import type { z } from 'zod';

export interface EventTextPart {
  type: 'text' | 'strong';
  content: string;
}

// New structured return type
export interface EventTextResult {
  primary: EventTextPart[];
  secondary: EventTextPart[];
}

export const getEventText = (
  type: string,
  data: z.infer<typeof EventStreamItemSchema>['data'],
): EventTextResult => {
  // Update return type
  const communityName = data.community_id
    ? data.community_id.charAt(0).toUpperCase() + data.community_id.slice(1)
    : '';

  switch (type) {
    case 'ContestStarted':
      return {
        primary: [{ type: 'strong', content: data.name || data.title || '' }],
        // Adjusted secondary text to better reflect design structure
        secondary: [
          { type: 'text', content: 'by ' },
          { type: 'strong', content: 'Community' },
        ], // Placeholder for now
      };
    case 'ContestEnding':
      return {
        primary: [{ type: 'strong', content: data.name || data.title || '' }],
        secondary: [{ type: 'text', content: 'ends soon' }], // Example
      };
    case 'ContestEnded':
      return {
        primary: [{ type: 'strong', content: data.name || data.title || '' }],
        secondary: [{ type: 'text', content: 'ended' }], // Example
      };
    case 'CommunityCreated':
      return {
        primary: [{ type: 'strong', content: data.name || '' }],
        secondary: [{ type: 'text', content: 'created' }], // Example
      };
    case 'ThreadCreated':
      return {
        primary: [{ type: 'strong', content: `"${data.title || ''}"` }],
        secondary: [
          { type: 'text', content: 'in ' },
          { type: 'strong', content: communityName },
        ],
      };
    default:
      return {
        primary: [{ type: 'strong', content: 'New activity' }],
        secondary: [], // Empty secondary array
      };
  }
};
