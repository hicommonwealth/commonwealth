import 'pages/landing/landing.scss';

import m from 'mithril';

import app from 'state';
import { symbols } from 'helpers';
import ChainStatusIndicator from 'views/components/chain_status_indicator';

const LandingPage : m.Component<{ header, body }> = {
  view: (vnode) => {
    return m('.LandingPage', [
      m('.landing-top', [
        m('.container', vnode.attrs.header),
      ]),
      m('.landing-bottom', [
        m('.container', vnode.attrs.body),
      ]),
    ]);
  }
};

export default LandingPage;
