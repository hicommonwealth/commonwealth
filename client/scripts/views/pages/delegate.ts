import 'pages/delegate.scss';

import m from 'mithril';
import app from 'state';
import { ChainNetwork } from 'types';

import Sublayout from 'views/sublayout';
import PageLoading from 'views/pages/loading';
import Compound from 'controllers/chain/ethereum/compound/adapter';
import Aave from 'controllers/chain/ethereum/aave/adapter';
import { notifyError, notifySuccess } from 'controllers/app/notifications';
import {
  Grid,
  Col,
  Form,
  FormGroup,
  FormLabel,
  Input,
  Button,
} from 'construct-ui';
import { PageNotFound } from './404';

const DelegateStats: m.Component<{ currentDelegate: string }> = {
  view: (vnode) => {
    if (!app.chain) return;

    return m(
      Grid,
      {
        align: 'middle',
        class: 'stats-container',
        gutter: 5,
        justify: 'space-between',
      },
      [
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
      ]
    );
  },
};

interface IDelegateForm {
  address: string;
  amount: number;
}

interface IDelegateFormState {
  form: IDelegateForm;
  loading: boolean;
  currentDelegate: string;
}

const getDelegate = async (
  vnode: m.Vnode<Record<string, never>, IDelegateFormState>
) => {
  if (app.chain.network === ChainNetwork.Compound) {
    vnode.state.currentDelegate = await (
      app.chain as Compound
    ).chain.getDelegate();
  } else if (app.chain.network === ChainNetwork.Aave) {
    // TODO: switch on delegation type
    vnode.state.currentDelegate = await (app.chain as Aave).chain.getDelegate(
      app.user.activeAccount.address,
      'voting'
    );
  }
  m.redraw();
};

// TODO: remove popup modal for delegation as we auto-delegate all tokens now
const setDelegate = async (
  vnode: m.Vnode<Record<string, never>, IDelegateFormState>
) => {
  if (app.chain.apiInitialized) {
    let delegationPromise: Promise<void>;
    if (app.chain.network === ChainNetwork.Compound) {
      delegationPromise = (app.chain as Compound).chain.setDelegate(
        vnode.state.form.address
      );
    } else if (app.chain.network === ChainNetwork.Aave) {
      delegationPromise = (app.chain as Aave).chain.setDelegate(
        vnode.state.form.address
      );
    }
    if (delegationPromise) {
      try {
        await delegationPromise;
        notifySuccess(
          `Sent transaction to delegate to ${vnode.state.form.address}`
        );
        getDelegate(vnode);
      } catch (err) {
        notifyError(`${err.message}`);
      }
    }
  }
};

const DelegateForm: m.Component<Record<string, never>, IDelegateFormState> = {
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
    const hasValue = app.chain.network === ChainNetwork.Compound;
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
                },
              }),
              hasValue && m(FormLabel, 'Amount to delegate:'),
              hasValue &&
                m(Input, {
                  name: 'amount',
                  placeholder: '10000',
                  defaultValue: '',
                  oninput: (e) => {
                    const result = (e.target as any).value;
                    vnode.state.form.amount = result;
                    m.redraw();
                  },
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
                  await setDelegate(vnode);
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
  },
};

const DelegatePage: m.Component = {
  view: () => {
    if (!app.chain || !app.chain.loaded) {
      // chain load failed
      if (app.chain && app.chain.failed) {
        return m(PageNotFound, {
          title: 'Wrong Ethereum Provider Network!',
          message: 'Change Metamask to point to Ethereum Mainnet',
        });
      }
      // wrong chain loaded
      if (
        app.chain &&
        app.chain.loaded &&
        app.chain.network !== ChainNetwork.Compound &&
        app.chain.network !== ChainNetwork.Aave
      ) {
        return m(PageNotFound, {
          title: 'Delegate Page',
          message: 'Delegate page for Marlin and Aave users only!',
        });
      }
      // chain loading
      return m(PageLoading, {
        message: 'Connecting to chain',
        title: 'Delegate',
      });
    }

    return m(
      Sublayout,
      {
        class: 'DelegatePage',
        title: 'Delegate',
      },
      [m('.forum-container', [m(DelegateForm, {})])]
    );
  },
};

export default DelegatePage;
