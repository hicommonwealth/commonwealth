/* @jsx m */

import m from 'mithril';
import $ from 'jquery';

import 'pages/create_community.scss';

import app from 'state';
import { initAppState } from 'app';
import { slugifyPreserveDashes } from 'utils';
import { ChainBase, ChainType } from 'types';
import { notifyError } from 'controllers/app/notifications';
import { IdRow, InputRow, SelectRow } from 'views/components/metadata_rows';
import { baseToNetwork } from 'views/components/login_with_wallet_dropdown';
import { initChainForm, defaultChainRows } from './chain_input_rows';
import { CWButton } from '../../components/component_kit/cw_button';
import { ChainFormFields, ChainFormState } from './types';

// TODO: ChainFormState contains "uploadInProgress" which is technically
// not part of the form (what we pass to /createChain), but of the general view's state,
// and should be located elsewhere.
type CreateStarterForm = ChainFormFields & { base: ChainBase };

type CreateStarterState = ChainFormState & { form: CreateStarterForm };
export class StarterCommunityForm implements m.ClassComponent {
  private state: CreateStarterState = {
    error: '',
    loaded: false,
    loading: false,
    saving: false,
    status: '',
    form: {
      id: '',
      name: '',
      symbol: 'XYZ',
      base: ChainBase.Ethereum,
      ...initChainForm(),
    },
  };

  view() {
    return (
      <div class="CreateCommunityForm">
        <InputRow
          title="Name"
          placeholder="Enter the name of your community"
          defaultValue={this.state.form.name}
          onChangeHandler={(v) => {
            this.state.form.name = v;
            this.state.form.id = slugifyPreserveDashes(v);
          }}
        />
        <IdRow id={this.state.form.id} />
        <InputRow
          title="Symbol"
          defaultValue={this.state.form.symbol}
          onChangeHandler={(v) => {
            this.state.form.symbol = v;
          }}
        />
        <SelectRow
          title="Base Chain"
          options={['cosmos', 'ethereum', 'near']}
          value={this.state.form.base}
          onchange={(value) => {
            this.state.form.base = value;
          }}
        />
        {...defaultChainRows(this.state.form)}
        <CWButton
          label="Save changes"
          buttonType="primary"
          disabled={this.state.saving || this.state.form.id.length < 1}
          onclick={async () => {
            this.state.saving = true;
            const additionalArgs: {
              eth_chain_id?: number;
              node_url?: string;
              bech32_prefix?: string;
              alt_wallet_url?: string;
            } = {};

            // defaults to be overridden when chain is no longer "starter" type
            switch (this.state.form.base) {
              case ChainBase.CosmosSDK: {
                additionalArgs.node_url = 'https://rpc-osmosis.blockapsis.com';
                additionalArgs.bech32_prefix = 'osmo';
                additionalArgs.alt_wallet_url = 'https://lcd-osmosis.blockapsis.com';
                break;
              }
              case ChainBase.NEAR: {
                additionalArgs.node_url = 'https://rpc.mainnet.near.org';
                break;
              }
              case ChainBase.Solana: {
                additionalArgs.node_url = 'https://api.mainnet-beta.solana.com';
                break;
              }
              case ChainBase.Substrate: {
                additionalArgs.node_url = 'wss://mainnet.edgewa.re';
                break;
              }
              case ChainBase.Ethereum:
              default: {
                additionalArgs.eth_chain_id = 1;
                additionalArgs.node_url =
                  'wss://eth-mainnet.alchemyapi.io/v2/BCNLWCaGqaXwCDHlZymPy3HpjXSxK7j_';
                additionalArgs.alt_wallet_url =
                  'https://eth-mainnet.alchemyapi.io/v2/BCNLWCaGqaXwCDHlZymPy3HpjXSxK7j_';
                break;
              }
            }
            const {
              id,
              name,
              symbol,
              iconUrl,
              description,
              website,
              discord,
              telegram,
              github,
              element,
              base,
             } = this.state.form;
            try {
              const res = await $.post(`${app.serverUrl()}/createChain`, {
                jwt: app.user.jwt,
                address: '',
                type: ChainType.Offchain,
                network: baseToNetwork(this.state.form.base),
                icon_url: iconUrl,
                id,
                name,
                symbol,
                base,
                description,
                discord,
                element,
                github,
                telegram,
                website,
                ...additionalArgs,
              });
              await initAppState(false);
              m.route.set(`/${res.result.chain?.id}`);
            } catch (err) {
              notifyError(
                err.responseJSON?.error ||
                  'Creating new starter community failed'
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
