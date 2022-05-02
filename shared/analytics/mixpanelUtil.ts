import { MixpanelPayload } from './types';
var Mixpanel = require('mixpanel');
var mixpanel;
if (process.env.NODE_ENV === 'production') {
  mixpanel = Mixpanel.init('993ca6dd7df2ccdc2a5d2b116c0e18c5');
} else {
  mixpanel = Mixpanel.init('312b6c5fadb9a88d98dc1fb38de5d900');
}
// TODO: Figure out how to change to production

// ----- Server Side Mixpanel Library Utils ------ //
export function mixpanelTrack(data: MixpanelPayload) {
  const { event, ...payload } = data;

  mixpanel.track(event, payload);
}

export function mixpanelPeopleSet(unique_id: string) {
  mixpanel.people.set(unique_id);
}
