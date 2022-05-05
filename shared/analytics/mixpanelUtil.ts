import { BaseMixpanelPayload } from './types';
var Mixpanel = require('mixpanel');
import { mixpanel as mixpanelBrowser } from 'mixpanel-browser';

var mixpanelNode;
if (process.env.NODE_ENV === 'production') {
  mixpanelNode = Mixpanel.init('993ca6dd7df2ccdc2a5d2b116c0e18c5');
} else {
  mixpanelNode = Mixpanel.init('312b6c5fadb9a88d98dc1fb38de5d900');
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

// ----- Client Side Mixpanel Library Utils ------ //

export function mixpanelBrowserTrack<T extends BaseMixpanelPayload>(data: T) {
  const { event, ...payload } = data;

  mixpanelBrowser.track(event, payload);
}

export function mixpanelBrowserIdentify(unique_id?: string) {
  if (unique_id) {
    mixpanelBrowser.identify(unique_id);
  } else {
    mixpanelBrowser.identify();
  }
}
