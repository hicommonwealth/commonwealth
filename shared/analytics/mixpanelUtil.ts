import { MixpanelPayload } from './types';
var Mixpanel = require('mixpanel');
var mixpanel = Mixpanel.init('312b6c5fadb9a88d98dc1fb38de5d900');
// TODO: Figure out how to change to production

// ----- Server Side Mixpanel Library Utils ------ //
export function mixpanelTrack(data: MixpanelPayload) {
  const { event, ...payload } = data;

  mixpanel.track(event, payload);
}
