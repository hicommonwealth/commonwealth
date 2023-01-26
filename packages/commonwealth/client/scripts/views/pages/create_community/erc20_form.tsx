/* @jsx m */

import { MixpanelCommunityCreationEvent } from 'analytics/types';
import { initAppState } from 'state';
import ClassComponent from 'class_component';
import { IERC20Metadata__factory } from 'common-common/src/eth/types';
import { ChainBase, ChainNetwork, ChainType } from 'common-common/src/types';
import { notifyError } from 'controllers/app/notifications';
import { providers } from 'ethers';
import { mixpanelBrowserTrack } from 'helpers/mixpanel_browser_util';
import $ from 'jquery';
import m from 'mithril';

import 'pages/create_community.scss';

import app from 'state';
import { slugify, slugifyPreserveDashes } from 'utils';
import { IdRow, InputRow } from 'views/components/metadata_rows';
import Web3 from 'web3';
import { isAddress } from 'web3-utils';
import { linkExistingAddressToChainOrCommunity } from '../../../controllers/app/login';
import { CWButton } from '../../components/component_kit/cw_button';
import { CWValidationText } from '../../components/component_kit/cw_validation_text';
import {
  defaultChainRows,
  ethChainRows,
  initChainForm,
} from './chain_input_rows';
import type {
  ChainFormFields,
  ChainFormState,
  EthChainAttrs,
  EthFormFields,
} from './types';

type CreateERC20Form = ChainFormFields & EthFormFields & { decimals: number };

type CreateERC20State = ChainFormState & { form: CreateERC20Form };

export class ERC20Form extends ClassComponent<EthChainAttrs> {
  private state: CreateERC20State = {
    message: '',
    loaded: false,
    loading: false,
    saving: false,
    status: undefined,
    form: {
      address: '',
      altWalletUrl: '',
      ethChainId: 1,
      chainString: 'Ethereum Mainnet',
      decimals: 18,
      id: '',
      name: '',
      symbol: 'XYZ',
      nodeUrl: '',
      ...initChainForm(),
    },
  };

  oninit(vnode: m.Vnode<EthChainAttrs>) {
    this.state.form.nodeUrl = vnode.attrs.ethChains[1].url;
  }

  view(vnode: m.Vnode<EthChainAttrs>) {
    const validAddress = isAddress(this.state.form.address);
    const disableField = !validAddress || !this.state.loaded;

    const updateTokenForum = async () => {
      if (!this.state.form.address || !this.state.form.ethChainId) return;
      this.state.status = undefined;
      this.state.message = '';
      this.state.loading = true;
      const args = {
        address: this.state.form.address,
        chain_id: this.state.form.ethChainId,
        chain_network: ChainNetwork.ERC20,
        url: this.state.form.nodeUrl,
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
            this.state.form.iconUrl = res.token.icon_url || '';
            if (this.state.form.iconUrl.startsWith('/')) {
              this.state.form.iconUrl = `https://commonwealth.im${this.state.form.iconUrl}`;
            }
            this.state.form.description = res.token.description || '';
            this.state.form.website = res.token.website || '';
            this.state.form.discord = res.token.discord || '';
            this.state.form.element = res.token.element || '';
            this.state.form.telegram = res.token.telegram || '';
            this.state.form.github = res.token.github || '';
            this.state.status = 'success';
            this.state.message = 'Success!';
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
              this.state.status = 'success';
              this.state.message = 'Success!';
            } catch (e) {
              this.state.form.name = '';
              this.state.form.id = '';
              this.state.form.symbol = '';
              this.state.form.decimals = 18;
              this.state.status = 'failure';
              this.state.message =
                'Verified token but could not load metadata.';
            }
            this.state.form.iconUrl = '';
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
          this.state.status = 'failure';
          this.state.message =
            res.message || 'Failed to load Token Information';
        }
      } catch (err) {
        this.state.status = 'failure';
        this.state.message =
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
          disabled={
            this.state.saving ||
            !validAddress ||
            !this.state.form.ethChainId ||
            this.state.loading
          }
          onclick={async () => {
            await updateTokenForum();
          }}
        />
        {this.state.message && (
          <CWValidationText
            message={this.state.message}
            status={this.state.status}
          />
        )}
        <InputRow
          title="Name"
          value={this.state.form.name}
          disabled={disableField}
          onChangeHandler={(v) => {
            this.state.form.name = v;
            this.state.form.id = slugifyPreserveDashes(v);
          }}
        />
        <IdRow id={this.state.form.id} />
        <InputRow
          title="Symbol"
          disabled={disableField}
          value={this.state.form.symbol}
          placeholder="XYZ"
          onChangeHandler={(v) => {
            this.state.form.symbol = v;
          }}
        />
        {...defaultChainRows(this.state.form, disableField)}
        <CWButton
          label="Save changes"
          disabled={this.state.saving || !validAddress || !this.state.loaded}
          onclick={async () => {
            const {
              altWalletUrl,
              chainString,
              ethChainId,
              nodeUrl,
              symbol,
              iconUrl,
            } = this.state.form;
            this.state.saving = true;
            mixpanelBrowserTrack({
              event: MixpanelCommunityCreationEvent.CREATE_COMMUNITY_ATTEMPTED,
              chainBase: null,
              isCustomDomain: app.isCustomDomain(),
              communityType: null,
            });
            try {
              const res = await $.post(`${app.serverUrl()}/createChain`, {
                alt_wallet_url: altWalletUrl,
                base: ChainBase.Ethereum,
                chain_string: chainString,
                eth_chain_id: ethChainId,
                icon_url: iconUrl,
                jwt: app.user.jwt,
                network: ChainNetwork.ERC20,
                node_url: nodeUrl,
                type: ChainType.Token,
                default_symbol: symbol,
                ...this.state.form,
              });
              if (res.result.admin_address) {
                await linkExistingAddressToChainOrCommunity(
                  res.result.admin_address,
                  res.result.role.chain_id,
                  res.result.role.chain_id
                );
              }
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
