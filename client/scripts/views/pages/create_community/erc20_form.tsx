/* @jsx m */

import m from 'mithril';
import $ from 'jquery';
import Web3 from 'web3';
import { providers } from 'ethers';
import { isAddress } from 'web3-utils';

import 'pages/create_community_test.scss';

import app from 'state';
import { initAppState } from 'app';
import { slugify } from 'utils';
import { ChainBase, ChainNetwork, ChainType } from 'types';
import { notifyError } from 'controllers/app/notifications';
import { IERC20Metadata__factory } from 'eth/types';
import { InputRow } from 'views/components/metadata_rows';
import {
  initChainForm,
  defaultChainRows,
  ethChainRows,
} from './chain_input_rows';
import {
  ChainFormFields,
  ChainFormState,
  EthChainAttrs,
  EthFormFields,
} from './types';
import { CWButton } from '../../components/component_kit/cw_button';

type CreateERC20Form = ChainFormFields & EthFormFields & { decimals: number };

type CreateERC20State = ChainFormState & { form: CreateERC20Form };

export class ERC20Form implements m.ClassComponent<EthChainAttrs> {
  private state: CreateERC20State = {
    error: '',
    loaded: false,
    loading: false,
    saving: false,
    status: '',
    form: {
      address: '',
      alt_wallet_url: '',
      chain_id: '1',
      chain_string: 'Ethereum Mainnet',
      decimals: 18,
      id: '',
      name: '',
      symbol: 'XYZ',
      // vnode.state.url = vnode.attrs.ethChains[1].url;
      url: '',
      ...initChainForm(),
    },
  };

  view(vnode) {
    const validAddress = isAddress(this.state.form.address);
    const disableField = !validAddress || !this.state.loaded;

    const updateTokenForum = async () => {
      if (!this.state.form.address || !this.state.form.chain_id) return;
      this.state.status = '';
      this.state.error = '';
      this.state.loading = true;
      const args = {
        address: this.state.form.address,
        chain_id: this.state.form.chain_id,
        url: this.state.form.url,
        allowUncached: true,
      };
      try {
        console.log('Querying backend for token data');
        const res = await $.get(`${app.serverUrl()}/getTokenForum`, args);
        if (res.status === 'Success') {
          if (res?.token?.name) {
            this.state.form.name = res.token.name || '';
            this.state.form.id = res.token.id && slugify(res.token.id);
            this.state.form.symbol = res.token.symbol || '';
            this.state.form.decimals = +res.token.decimals || 18;
            this.state.form.icon_url = res.token.icon_url || '';
            if (this.state.form.icon_url.startsWith('/')) {
              this.state.form.icon_url = `https://commonwealth.im${this.state.form.icon_url}`;
            }
            this.state.form.description = res.token.description || '';
            this.state.form.website = res.token.website || '';
            this.state.form.discord = res.token.discord || '';
            this.state.form.element = res.token.element || '';
            this.state.form.telegram = res.token.telegram || '';
            this.state.form.github = res.token.github || '';
            this.state.status = 'Success!';
          } else {
            // attempt to query ERC20Detailed token info from chain
            console.log('Querying chain for ERC info');
            const provider = new Web3.providers.WebsocketProvider(args.url);
            try {
              const ethersProvider = new providers.Web3Provider(provider);
              const contract = IERC20Metadata__factory.connect(
                args.address,
                ethersProvider
              );
              const name = await contract.name();
              const symbol = await contract.symbol();
              const decimals = await contract.decimals();
              this.state.form.name = name || '';
              this.state.form.id = name && slugify(name);
              this.state.form.symbol = symbol || '';
              this.state.form.decimals = decimals || 18;
              this.state.status = 'Success!';
            } catch (e) {
              this.state.form.name = '';
              this.state.form.id = '';
              this.state.form.symbol = '';
              this.state.form.decimals = 18;
              this.state.status = 'Verified token but could not load metadata.';
            }
            this.state.form.icon_url = '';
            this.state.form.description = '';
            this.state.form.website = '';
            this.state.form.discord = '';
            this.state.form.element = '';
            this.state.form.telegram = '';
            this.state.form.github = '';
            provider.disconnect(1000, 'finished');
          }
          this.state.loaded = true;
        } else {
          this.state.error = res.message || 'Failed to load Token Information';
        }
      } catch (err) {
        this.state.error =
          err.responseJSON?.error || 'Failed to load Token Information';
      }
      this.state.loading = false;
      m.redraw();
    };

    return (
      <div class="CreateCommunityForm">
        {...ethChainRows(vnode.attrs, this.state.form)}
        <CWButton
          label="Populate fields"
          buttonType="primary"
          disabled={
            this.state.saving ||
            !validAddress ||
            !this.state.form.chain_id ||
            this.state.loading
          }
          onclick={async (e) => {
            await updateTokenForum();
          }}
        />
        {this.state.error &&
          m('tr', [
            m('td', { class: 'title-column' }, 'Error'),
            m('td', { class: 'error-column' }, this.state.error),
          ])}
        {this.state.status &&
          m('tr', [
            m('td', { class: 'title-column' }, 'Test Status'),
            m('td', { class: 'status-column' }, `${this.state.status}`),
          ])}
        <InputRow
          title="Name"
          defaultValue={this.state.form.name}
          disabled={disableField}
          onChangeHandler={(v) => {
            this.state.form.name = v;
            this.state.form.id = slugify(v);
          }}
        />
        <InputRow
          title="ID"
          defaultValue={this.state.form.id}
          value={this.state.form.id}
          disabled={disableField}
          onChangeHandler={(v) => {
            this.state.form.id = v;
          }}
        />
        <InputRow
          title="Symbol"
          disabled={disableField}
          defaultValue={this.state.form.symbol}
          placeholder="XYZ"
          onChangeHandler={(v) => {
            this.state.form.symbol = v;
          }}
        />
        {...defaultChainRows(this.state.form, disableField)}
        <CWButton
          class="mt-3"
          label="Save changes"
          buttonType="primary"
          disabled={this.state.saving || !validAddress || !this.state.loaded}
          onclick={async (e) => {
            const {
              address,
              id,
              name,
              description,
              symbol,
              icon_url,
              website,
              discord,
              element,
              telegram,
              github,
              chain_id,
              url,
              decimals,
              alt_wallet_url,
            } = this.state.form;
            this.state.saving = true;
            try {
              const res = await $.post(`${app.serverUrl()}/createChain`, {
                address,
                id,
                name,
                description,
                icon_url,
                symbol,
                website,
                discord,
                element,
                telegram,
                github,
                decimals,
                jwt: app.user.jwt,
                type: ChainType.Token,
                base: ChainBase.Ethereum,
                network: ChainNetwork.ERC20,
                node_url: url,
                eth_chain_id: +chain_id,
                alt_wallet_url,
              });
              await initAppState(false);
              m.route.set(`/${res.result.chain?.id}`);
            } catch (err) {
              notifyError(
                err.responseJSON?.error || 'Creating new ERC20 community failed'
              );
            } finally {
              this.state.saving = false;
            }
          }}
        />
      </div>
    );
  }
}
