import Mixpanel from 'mixpanel';
import mixpanel from 'mixpanel-browser';
import type { BaseMixpanelPayload } from './types';
import { factory, formatFilename } from 'common-common/src/logging';
const log = factory.getLogger(formatFilename(__filename));

let mixpanelNode;

try {
  if (process.env.NODE_ENV === 'production') {
    mixpanelNode = Mixpanel.init(process.env.MIXPANEL_PROD_TOKEN);
  } else if (process.env.NODE_ENV === 'development') {
    // NOTE: Only works if NODE_ENV defined in .env
    // Make sure that is set to development if you want to use backend Mixpanel locally.
    mixpanelNode = Mixpanel.init(process.env.MIXPANEL_DEV_TOKEN);
  }
} catch (e) {
  console.log('Unable to initialized the backend mixpanel client: ', e);
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

// ----- Client Side Mixpanel Library Utils ------ //
export function mixpanelBrowserTrack<T extends BaseMixpanelPayload>(data: T) {
  const { event, ...payload } = data;

  mixpanel.track(event, payload);
}
