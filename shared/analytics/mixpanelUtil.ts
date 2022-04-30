import { MixpanelPayload } from './types';

var Mixpanel = require('mixpanel');
var mixpanel = Mixpanel.init('0ee7b2f7722162b820f75b35b3de5e27');
// ----- Server Side Mixpanel Library Utils ------ //

export function mixpanelTrack(data: MixpanelPayload) {
  const { event, ...payload } = data;

  mixpanel.track(event, payload);
}
