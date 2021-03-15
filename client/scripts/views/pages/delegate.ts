
import 'pages/proposals.scss';

import m from 'mithril';
import app from 'state';
import { ChainNetwork } from 'models';

import Sublayout from 'views/sublayout';
import PageLoading from 'views/pages/loading';
import Marlin from 'controllers/chain/ethereum/marlin/adapter';
import { notifyError, notifySuccess } from 'controllers/app/notifications';
import { Grid, Col, List, Form, FormGroup, FormLabel, Input, Button } from 'construct-ui';
import PageNotFound from './404';

const getDelegate = async (vnode) => {
  vnode.state.currentDelegate = await (app.chain as Marlin).marlinAccounts.senderGetDelegate();
};

const DelegateStats: m.Component<{ currentDelegate: string, }> = {
  view: (vnode) => {
    if (!app.chain) return;

    return m(Grid, {
      align: 'middle',
      class: 'stats-container',
      gutter: 5,
      justify: 'space-between'
    }, [
      m(Col, { span: { xs: 6, md: 3 } }, [
        m('.stats-tile', [
          m('.stats-heading', 'Current Delegate'),
          vnode.attrs.currentDelegate
            ? m('.stats-tile-figure-minor', vnode.attrs.currentDelegate)
            : '--',
        ]),
        m('.stats-tile', [
          m('.stats-heading', 'Your address:'),
          app.user.activeAccount.address
            ? m('.stats-tile-figure-minor', app.user.activeAccount.address)
            : '--',
        ]),
      ]),
      // m(Col, { span: { xs: 6, md: 3 } }, [
      //   m('.stats-tile', [
      //     m('.stats-heading', 'Your address:'),
      //     app.user.activeAccount.address
      //       ? m('.stats-tile-figure-minor', app.user.activeAccount.address)
      //       : '--',
      //   ]),
      // ]),
    ]);
  }
};

interface IDelegateForm {
  address: string,
  amount: number,
}

const DelegateForm: m.Component<{}, { form: IDelegateForm, loading: boolean, currentDelegate: string, }> = {
  oninit: (vnode) => {
    vnode.state.form = {
      address: '',
      amount: null,
    };
    vnode.state.loading = false;
    getDelegate(vnode);
  },
  view: (vnode) => {
    const { form, loading } = vnode.state;
    return [
      m(DelegateStats, {
        currentDelegate: vnode.state.currentDelegate,
      }),
      m(Form, { class: 'DelegateForm' }, [
        m(Grid, [
          m(Col, [
            m('h2', 'Set up your delegation:'),
            m(FormGroup, [
              m(FormLabel, 'Your delegate:'),
              m(Input, {
                name: 'address',
                placeholder: 'Paste address you want to delegate to',
                oninput: (e) => {
                  const result = (e.target as any).value;
                  vnode.state.form.address = result;
                  m.redraw();
                }
              }),
              m(FormLabel, 'Amount of MPOND to delegate:'),
              m(Input, {
                name: 'amount',
                placeholder: '10000',
                defaultValue: '',
                oninput: (e) => {
                  const result = (e.target as any).value;
                  vnode.state.form.amount = result;
                  m.redraw();
                }
              }),
            ]),
            m(FormGroup, [
              m(Button, {
                disabled: form.address === '' || loading,
                intent: 'primary',
                rounded: true,
                label: 'Delegate!',
                onclick: async (e) => {
                  e.preventDefault();
                  vnode.state.loading = true;
                  if ((app.chain as Marlin).apiInitialized) {
                    await (app.chain as Marlin).marlinAccounts.senderSetDelegate(vnode.state.form.address, vnode.state.form.amount)
                      .then(async () => {
                        notifySuccess(`Sent transaction to delegate to ${vnode.state.form.address}`);
                        await getDelegate(vnode);
                        m.redraw();
                      })
                      .catch((err) => { notifyError(`${err.message}`); });
                  }
                  vnode.state.loading = false;
                  m.redraw();
                },
                type: 'submit',
              }),
            ]),
          ]),
        ]),
      ]),
    ];
  }
};

const DelegatePage: m.Component<{}> = {
  view: (vnode) => {
    if (!app.chain || !app.chain.loaded) {
      // chain load failed
      if (app.chain && app.chain.failed) {
        return m(PageNotFound, {
          title: 'Wrong Ethereum Provider Network!',
          message: 'Change Metamask to point to Ethereum Mainnet',
        });
      }
      // wrong chain loaded
      if (app.chain && app.chain.loaded
          && [ChainNetwork.Marlin, ChainNetwork.MarlinTestnet].includes(app.chain.network)
      ) {
        return m(PageNotFound, {
          title: 'Delegate Page',
          message: 'Delegate page for Marlin users only!'
        });
      }
      // chain loading
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
