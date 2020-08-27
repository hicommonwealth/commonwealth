import 'components/proposals/convictions_table.scss';

import m from 'mithril';
import { formatDuration, blockperiodToDuration } from 'helpers';
import { Button } from 'construct-ui';

import app from 'state';
import {
  convictionToWeight, convictionToLocktime, convictions
} from 'controllers/chain/substrate/democracy_referendum';
import Substrate from 'controllers/chain/substrate/main';
import SubstrateChain from 'client/scripts/controllers/chain/substrate/shared';

export const ConvictionsChooser = {
  view: (vnode) => {
    if (!vnode.attrs.callback) throw new Error('Misconfigured');

    return m('.ConvictionsChooser', {
      oncreate: () => {
        const c = convictions()[0];
        vnode.state.selectedConviction = c.toString();
        vnode.attrs.callback(c.toString());
      }
    }, [
      convictions().map((c) => m(Button, {
        intent: 'primary',
        active: vnode.state.selectedConviction === c.toString(),
        onclick: ((e) => {
          e.preventDefault();
          vnode.state.selectedConviction = c.toString();
          vnode.attrs.callback(c.toString());
        }),
        label: `${convictionToWeight(c)}x weight (${convictionToLocktime(c)}x locktime)`,
      }))
    ]);
  }
};

const ConvictionsTable = {
  view: (vnode) => {
    const rows = convictions().map((c) => m('tr', [
      m('td', `${convictionToWeight(c)}x`),
      m('td', convictionToLocktime(c) ? [
        formatDuration(
          blockperiodToDuration((app.chain as Substrate).democracy.enactmentPeriod * convictionToLocktime(c))
        ),
        ` (${convictionToLocktime(c)}x)`
      ] : 'None'),
    ]));
    const expand = m('tr', [
      m('td', { colspan: 2 }, [
        m('a.expand-convictions', {
          href: '#',
          onclick: (e) => {
            e.preventDefault();
            vnode.state.expanded = true;
          }
        }, 'More...')
      ]),
    ]);
    const collapse = m('tr', [
      m('td', { colspan: 2 }, [
        m('a.collapse-convictions', {
          href: '#',
          onclick: (e) => {
            e.preventDefault();
            vnode.state.expanded = false;
          }
        }, 'Less...')
      ]),
    ]);
    return m('table.locktimes.ConvictionsTable', [
      m('thead', [
        m('tr', [
          m('th', 'Weight'),
          m('th', 'Locktime'),
        ]),
      ]),
      m('tbody', !vnode.state.expanded ? [ rows.slice(0, 2), expand ] : [ rows, collapse ])
    ]);
  }
};

export default ConvictionsTable;
