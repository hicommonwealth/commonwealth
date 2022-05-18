import { BaseMixpanelPayload } from '../../shared/analytics/types';
import { factory, formatFilename } from '../../shared/logging';
const log = factory.getLogger(formatFilename(__filename));

var Mixpanel = require('mixpanel');
var mixpanelNode;

if (process.env.NODE_ENV === 'production') {
  mixpanelNode = Mixpanel.init(process.env.MIXPANEL_PROD_TOKEN); //TODO: Swap with prod token when tested
} else if (process.env.NODE_ENV === 'development') {
  // NOTE: Only works if NODE_ENV defined in .env
  // Make sure that is set to development if you want to use backend Mixpanel locally.
  mixpanelNode = Mixpanel.init(process.env.MIXPANEL_DEV_TOKEN);
}

// ----- Server Side Mixpanel Library Utils ------ //
export function mixpanelTrack<T extends BaseMixpanelPayload>(data: T) {
  const { event, ...payload } = data;
  try {
    mixpanelNode?.track(event, payload);
  } catch (e) {
    log.error(`Failed to track event, ${event.toString()}:`, e.message);
  }
}

export function mixpanelPeopleSet(unique_id: string) {
  try {
    mixpanelNode?.people.set(unique_id);
  } catch (e) {
    log.error(`Failed to set people, id: ${unique_id}:`, e.message);
  }
}
