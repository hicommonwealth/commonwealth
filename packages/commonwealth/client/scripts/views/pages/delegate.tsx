/* @jsx m */

import m from 'mithril';
import {
  Grid,
  Col,
  Form,
  FormGroup,
  FormLabel,
  Input,
  Button,
} from 'construct-ui';

import 'pages/delegate.scss';

import app from 'state';
import { ChainNetwork } from 'common-common/src/types';
import Sublayout from 'views/sublayout';
import { PageLoading } from 'views/pages/loading';
import Compound from 'controllers/chain/ethereum/compound/adapter';
import Aave from 'controllers/chain/ethereum/aave/adapter';
import { notifyError, notifySuccess } from 'controllers/app/notifications';
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
      ]
    );
  },
};

type DelegateFormType = {
  address: string;
  amount: number;
};

type DelegateFormState = {
  currentDelegate: string;
  form: DelegateFormType;
  loading: boolean;
};

const getDelegate = async (
  vnode: m.Vnode<Record<string, never>, DelegateFormState>
) => {
  if (app.chain.network === ChainNetwork.Compound) {
    this.currentDelegate = await (app.chain as Compound).chain.getDelegate();
  } else if (app.chain.network === ChainNetwork.Aave) {
    // TODO: switch on delegation type
    this.currentDelegate = await (app.chain as Aave).chain.getDelegate(
      app.user.activeAccount.address,
      'voting'
    );
  }
  m.redraw();
};

// TODO: remove popup modal for delegation as we auto-delegate all tokens now
const setDelegate = async (
  vnode: m.Vnode<Record<string, never>, DelegateFormState>
) => {
  if (app.chain.apiInitialized) {
    let delegationPromise: Promise<void>;
    if (app.chain.network === ChainNetwork.Compound) {
      delegationPromise = (app.chain as Compound).chain.setDelegate(
        this.form.address
      );
    } else if (app.chain.network === ChainNetwork.Aave) {
      delegationPromise = (app.chain as Aave).chain.setDelegate(
        this.form.address
      );
    }
    if (delegationPromise) {
      try {
        await delegationPromise;
        notifySuccess(`Sent transaction to delegate to ${this.form.address}`);
        getDelegate(vnode);
      } catch (err) {
        notifyError(`${err.message}`);
      }
    }
  }
};

class DelegateForm implements m.ClassComponent {
  private currentDelegate: string;
  private form: DelegateFormType;
  private loading: boolean;

  oninit(vnode) {
    this.form = {
      address: '',
      amount: null,
    };

    this.loading = false;

    getDelegate(vnode);
  }

  view(vnode) {
    const { form, loading } = this;

    const hasValue = app.chain.network === ChainNetwork.Compound;

    return [
      m(DelegateStats, {
        currentDelegate: this.currentDelegate,
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
                  this.form.address = result;
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
                    this.form.amount = result;
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
                  this.loading = true;
                  await setDelegate(vnode);
                  this.loading = false;
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
}

class DelegatePage implements m.ClassComponent {
  view() {
    if (!app.chain || !app.chain.loaded) {
      // chain load failed
      if (app.chain && app.chain.failed) {
        return (
          <PageNotFound
            title="Wrong Ethereum Provider Network!"
            message="Change Metamask to point to Ethereum Mainnet"
          />
        );
      }

      // wrong chain loaded
      if (
        app.chain &&
        app.chain.loaded &&
        app.chain.network !== ChainNetwork.Compound &&
        app.chain.network !== ChainNetwork.Aave
      ) {
        return (
          <PageNotFound
            title="Delegate Page"
            message="Delegate page for Marlin and Aave users only!"
          />
        );
      }

      // chain loading
      return <PageLoading message="Connecting to chain" title="Delegate" />;
    }

    return (
      <Sublayout title="Delegate">
        <DelegateForm />
      </Sublayout>
    );
  }
}

export default DelegatePage;
