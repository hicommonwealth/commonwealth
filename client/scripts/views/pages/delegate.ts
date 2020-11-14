
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

const DelegateStats: m.Component<{}, {currentDelegate: string, }> = {
  oninit: (vnode) => {
    vnode.state.currentDelegate = null;
    getDelegate(vnode).then(() => m.redraw());
  },
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
          vnode.state.currentDelegate
            ? m('.stats-tile-figure-minor', vnode.state.currentDelegate)
            : '--',
        ]),
      ]),
    ]);
  }
};

interface IDelegateForm {
  address: string,
}

const DelegateForm: m.Component<{}, { form: IDelegateForm, loading: boolean, }> = {
  oninit: (vnode) => {
    vnode.state.form = {
      address: '',
    };
    vnode.state.loading = false;
  },
  view: (vnode) => {
    const { form, loading } = vnode.state;
    return m(Form, { class: 'DelegateForm' }, [
      m(Grid, [
        m(Col, [
          m(FormGroup, [
            m(FormLabel, `Address to Delegate to (your address is: ${app.user.activeAccount.address}):`),
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
              disabled: form.address === '' || loading,
              intent: 'primary',
              label: 'Delegate!',
              onclick: async (e) => {
                e.preventDefault();
                vnode.state.loading = true;
                console.log('HELLO????');
                if ((app.chain as Marlin).apiInitialized) {
                  await (app.chain as Marlin).marlinAccounts.senderSetDelegate(vnode.state.form.address)
                    .then(() => { notifySuccess(`Successfully delegated to ${vnode.state.form.address}`); })
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
    ]);
  }
};

const DelegatePage: m.Component<{}> = {
  view: (vnode) => {
    if (!app.chain || !app.chain.loaded) {
      if (app.chain && app.chain?.network !== ChainNetwork.Marlin) {
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
        m(DelegateStats),
        m(DelegateForm, {}),
      ]),
    ]);
  }
};

export default DelegatePage;
