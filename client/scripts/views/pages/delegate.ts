
import 'pages/proposals.scss';

import m from 'mithril';
import mixpanel from 'mixpanel-browser';

import app from 'state';
import { formatCoin } from 'adapters/currency';
import { formatDuration, blockperiodToDuration } from 'helpers';
import { ProposalType } from 'identifiers';
import { ChainClass, ChainBase, ChainNetwork } from 'models';
import Edgeware from 'controllers/chain/edgeware/main';
import {
  convictionToWeight, convictionToLocktime, convictions
} from 'controllers/chain/substrate/democracy_referendum';
import Sublayout from 'views/sublayout';
import PageLoading from 'views/pages/loading';
import ProposalsLoadingRow from 'views/components/proposals_loading_row';
import ProposalRow from 'views/components/proposal_row';
import { CountdownUntilBlock } from 'views/components/countdown';
import Substrate from 'controllers/chain/substrate/main';
import Cosmos from 'controllers/chain/cosmos/main';
import Moloch from 'controllers/chain/ethereum/moloch/adapter';
import Marlin from 'controllers/chain/ethereum/marlin/adapter';
import NewProposalPage from 'views/pages/new_proposal/index';
import { Grid, Col, List, Form, FormGroup, FormLabel, Input, Button } from 'construct-ui';
import moment from 'moment';
import Listing from './listing';
import ErrorPage from './error';
import PageNotFound from './404';

interface IDelegateForm {
  address: string,
}

const DelegateForm: m.Component<{}, { form: IDelegateForm, }> = {
  oninit: (vnode) => {
    vnode.state.form = {
      address: '',
    };
  },
  view: (vnode) => {
    return m(Form, { class: 'DelegateForm' }, [
      m(Grid, [
        m(Col, [
          m(FormGroup, [
            m(FormLabel, `Address to Delegate to (your address: ${app.user.activeAccount.address}):`),
            m(Input, {
              options: {
                name: 'address',
                placeholder: 'Paste address you want to delegate to',
                defaultValue: 'hello',
              },
              oninput: (e) => {
                const result = (e.target as any).value;
                vnode.state.form.address = result;
                m.redraw();
              }
            })
          ]),
          m(FormLabel, [
            m(Button, {
              disabled: vnode.state.form.address === '',
              intent: 'primary',
              label: 'Delegate!',
              onclick: (e) => {
                e.preventDefault();
                console.log('HELLO????');
              },
              type: 'submit',
            }),
          ]),
        ]),
      ]),
    ]);
  }
};

const DelegatePage: m.Component<{}> = {
  view: (vnode) => {
    if (!app.chain || !app.chain.loaded) {
      if (app.chain?.network !== ChainNetwork.Marlin || !app.isLoggedIn()) {
        return m(PageNotFound, {
          title: 'Delegate Page',
          message: 'Delegate page for Marlin users only!'
        });
      }
      return m(PageLoading, {
        message: 'Connecting to chain (may take up to 10s)...',
        title: 'Delegate',
      });
    }

    return m(Sublayout, {
      class: 'DelegatePage',
      title: 'Delegate',
    }, [
      m('.forum-container', [
        m(DelegateForm, {}),
      ]),
    ]);
  }
};

export default DelegatePage;
