import mixpanel from 'mixpanel-browser';
import { BaseMixpanelPayload } from '../../../shared/analytics/types';

// ----- Client Side Mixpanel Library Utils ------ //

export function mixpanelBrowserTrack<T extends BaseMixpanelPayload>(data: T) {
  const { event, ...payload } = data;

  mixpanel.track(event, payload);
}

export function mixpanelBrowserIdentify(unique_id?: string) {
  if (unique_id) {
    mixpanel.identify(unique_id);
  } else {
    mixpanel.identify();
  }
}
