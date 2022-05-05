/* @jsx m */

import m from 'mithril';
import $ from 'jquery';
import * as solw3 from '@solana/web3.js';

import app from 'state';
import { initAppState } from 'app';
import { slugifyPreserveDashes } from 'utils';
import { ChainBase, ChainNetwork, ChainType } from 'types';
import { notifyError } from 'controllers/app/notifications';
import {
  IdRow,
  InputRow,
  SelectRow,
  ValidationRow,
} from 'views/components/metadata_rows';
import { initChainForm, defaultChainRows } from './chain_input_rows';
import { ChainFormFields, ChainFormState } from './types';
import { CWButton } from '../../components/component_kit/cw_button';
import {
  MixpanelCommunityCreationEvent,
  MixpanelCommunityCreationPayload,
} from 'analytics/types';
import { mixpanelBrowserTrack } from 'helpers/mixpanel_browser_util';

type SplTokenFormFields = {
  cluster: solw3.Cluster;
  decimals: number;
  mint: string;
};

type CreateERC20Form = ChainFormFields & SplTokenFormFields;

type CreateSplTokenState = ChainFormState & { form: CreateERC20Form };

export class SplTokenForm implements m.ClassComponent {
  private state: CreateSplTokenState = {
    error: '',
    loaded: false,
    loading: false,
    saving: false,
    status: '',
    form: {
      cluster: 'mainnet-beta',
      decimals: 6,
      id: '',
      mint: '',
      name: '',
      symbol: '',
      ...initChainForm(),
    },
  };

  view() {
    const disableField = !this.state.loaded;

    const updateTokenForum = async () => {
      this.state.status = '';
      this.state.error = '';
      let mintPubKey: solw3.PublicKey;
      try {
        mintPubKey = new solw3.PublicKey(this.state.form.mint);
      } catch (e) {
        this.state.error = 'Invalid mint address';
        return false;
      }
      if (!mintPubKey) return;
      this.state.loading = true;
      try {
        const url = solw3.clusterApiUrl(this.state.form.cluster);
        const connection = new solw3.Connection(url);
        const supply = await connection.getTokenSupply(mintPubKey);
        const { decimals, amount } = supply.value;
        this.state.form.decimals = decimals;
        this.state.loaded = true;
        this.state.status = `Found ${amount} supply!`;
      } catch (err) {
        this.state.error = `Error: ${err.message}` || 'Failed to load token';
      }
      this.state.loading = false;
      m.redraw();
    };

    return (
      <div class="CreateCommunityForm">
        <SelectRow
          title="Cluster"
          options={['mainnet-beta', 'testnet', 'devnet']}
          value={this.state.form.cluster}
          onchange={(value) => {
            this.state.form.cluster = value;
            this.state.loaded = false;
          }}
        />
        <InputRow
          title="Mint Address"
          defaultValue={this.state.form.mint}
          placeholder="2sgDUTgTP6e9CrJtexGdba7qZZajVVHf9TiaCtS9Hp3P"
          onChangeHandler={(v) => {
            this.state.form.mint = v.trim();
            this.state.loaded = false;
          }}
        />
        <CWButton
          label="Check address"
          buttonType="primary"
          disabled={this.state.saving || this.state.loading}
          onclick={async () => {
            await updateTokenForum();
          }}
        />
        <ValidationRow error={this.state.error} status={this.state.status} />
        <InputRow
          title="Name"
          defaultValue={this.state.form.name}
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
          defaultValue={this.state.form.symbol}
          placeholder="XYZ"
          onChangeHandler={(v) => {
            this.state.form.symbol = v;
          }}
        />
        <InputRow
          title="Decimals"
          defaultValue={`${this.state.form.decimals}`}
          disabled={true}
          onChangeHandler={(v) => {
            this.state.form.decimals = +v;
          }}
        />
        {...defaultChainRows(this.state.form, disableField)}
        <CWButton
          label="Save changes"
          buttonType="primary"
          disabled={this.state.saving || !this.state.loaded}
          onclick={async () => {
            const { cluster, iconUrl, mint } = this.state.form;
            this.state.saving = true;
            mixpanelBrowserTrack({
              event: MixpanelCommunityCreationEvent.CREATE_COMMUNITY_ATTEMPTED,
              chainBase: null,
              communityType: null,
            });
            try {
              const res = await $.post(`${app.serverUrl()}/createChain`, {
                address: mint,
                base: ChainBase.Solana,
                icon_url: iconUrl,
                jwt: app.user.jwt,
                network: ChainNetwork.SPL,
                node_url: cluster,
                type: ChainType.Token,
                ...this.state.form,
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
