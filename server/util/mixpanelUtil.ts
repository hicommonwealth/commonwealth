import { BaseMixpanelPayload } from '../../shared/analytics/types';
var Mixpanel = require('mixpanel');
var mixpanelNode;
if (process.env.NODE_ENV === 'production') {
  mixpanelNode = Mixpanel.init(process.env.MIXPANEL_DEV_TOKEN); //TODO: Swap with prod token when tested
} else {
  mixpanelNode = Mixpanel.init(process.env.MIXPANEL_DEV_TOKEN);
}
// TODO: Figure out how to change to production

// ----- Server Side Mixpanel Library Utils ------ //
export function mixpanelTrack<T extends BaseMixpanelPayload>(data: T) {
  const { event, ...payload } = data;

  mixpanelNode.track(event, payload);
}

export function mixpanelPeopleSet(unique_id: string) {
  mixpanelNode.people.set(unique_id);
}
