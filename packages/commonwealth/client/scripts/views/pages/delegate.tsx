/* @jsx jsx */
import React from 'react';

import {
  ClassComponent,
  ResultNode,
  render,
  setRoute,
  getRoute,
  getRouteParam,
  redraw,
  Component,
  jsx,
} from 'mithrilInterop';
import { ChainNetwork } from 'common-common/src/types';
import { notifyError, notifySuccess } from 'controllers/app/notifications';
import type Aave from 'controllers/chain/ethereum/aave/adapter';
import type Compound from 'controllers/chain/ethereum/compound/adapter';

import 'pages/delegate.scss';

import app from 'state';
import { PageLoading } from 'views/pages/loading';
import Compound from 'controllers/chain/ethereum/compound/adapter';
import Aave from 'controllers/chain/ethereum/aave/adapter';
import { notifyError, notifySuccess } from 'controllers/app/notifications';
import PageNotFound from './404';
import Sublayout from 'views/sublayout';
import { CWButton } from '../components/component_kit/cw_button';
import { CWText } from '../components/component_kit/cw_text';
import { CWTextInput } from '../components/component_kit/cw_text_input';
import { GovExplainer } from '../components/gov_explainer';
import { PageNotFound } from './404';

type DelegateFormType = {
  address: string;
  amount: number;
};

class DelegateForm extends ClassComponent {
  private currentDelegate: string;
  private form: DelegateFormType;
  private loading: boolean;

  oninit() {
    this.form = {
      address: '',
      amount: null,
    };

    this.loading = false;

    this.getDelegate();
  }

  async getDelegate() {
    if (app.chain.network === ChainNetwork.Compound) {
      this.currentDelegate = await (app.chain as Compound).chain.getDelegate();
    } else if (app.chain.network === ChainNetwork.Aave) {
      // TODO: switch on delegation type
      this.currentDelegate = await (app.chain as Aave).chain.getDelegate(
        app.user.activeAccount.address,
        'voting'
      );
    }

    redraw();
  }

  async setDelegate(address: string) {
    if (app.chain.apiInitialized) {
      let delegationPromise: Promise<void>;

      if (app.chain.network === ChainNetwork.Compound) {
        delegationPromise = (app.chain as Compound).chain.setDelegate(address);
      } else if (app.chain.network === ChainNetwork.Aave) {
        delegationPromise = (app.chain as Aave).chain.setDelegate(address);
      }

      if (delegationPromise) {
        try {
          await delegationPromise;
          notifySuccess(`Sent transaction to delegate to ${address}`);
          this.getDelegate();
        } catch (err) {
          notifyError(`${err.message}`);
        }
      }
    }
  }

  view() {
    const { form, loading } = this;

    const hasValue = app.chain.network === ChainNetwork.Compound;

    return (
      <div className="DelegateForm">
        <GovExplainer
          statHeaders={[
            {
              statName: 'Current Delegate:',
              statDescription: this.currentDelegate || '--',
            },
          ]}
          stats={[
            {
              statHeading: 'Your address:',
              stat: app.user.activeAccount.address || '--',
            },
          ]}
        />
        <CWText type="h4">Set up your delegation</CWText>
        <CWTextInput
          label="Your delegate"
          placeholder="Paste address you want to delegate to"
          onInput={(e) => {
            const result = (e.target as any).value;
            this.form.address = result;
            redraw();
          }}
        />
        {hasValue && (
          <CWTextInput
            label="Amount to delegate"
            placeholder="10000"
            value=""
            onInput={(e) => {
              const result = (e.target as any).value;
              this.form.amount = result;
              redraw();
            }}
          />
        )}
        <CWButton
          disabled={form.address === '' || loading}
          label="Delegate!"
          onClick={async (e) => {
            e.preventDefault();
            this.loading = true;
            await this.setDelegate(form.address);
            this.loading = false;
            redraw();
          }}
        />
      </div>
    );
  }
}

class DelegatePage extends ClassComponent {
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
      <Sublayout
      // title="Delegate"
      >
        <DelegateForm />
      </Sublayout>
    );
  }
}

export default DelegatePage;
