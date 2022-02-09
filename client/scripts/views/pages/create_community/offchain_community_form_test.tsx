/* @jsx m */

import m from 'mithril';
import { Table } from 'construct-ui';
import $ from 'jquery';

import 'pages/create_community_test.scss';

import app from 'state';
import { initAppState } from 'app';
import { slugify } from 'utils';
import { ChainBase, ChainType } from 'types';
import { notifyError } from 'controllers/app/notifications';
import {
  InputPropertyRow,
  SelectPropertyRow,
} from 'views/components/metadata_rows_test';
import { baseToNetwork } from 'views/components/login_with_wallet_dropdown';
import {
  // ChainFormState,
  // initChainForm,
  defaultChainRows,
} from './chain_input_rows_test';
import { CWButton } from '../../components/component_kit/cw_button';

export class OffchainFormTest implements m.ClassComponent {
  id: string;
  name: string;
  base: ChainBase;
  saving: boolean;
  loaded: boolean;
  loading: boolean;
  symbol: string;
  error: string;
  description: string;
  icon_url: string;
  website: string;
  discord: string;
  element: string;
  telegram: string;
  github: string;
  uploadInProgress: boolean;

  oninit() {
    this.id = '';
    this.name = '';
    this.base = ChainBase.Ethereum;
    this.saving = false;
    this.loaded = false;
    this.loading = false;
    this.symbol = 'XYZ';
    this.error = '';
    this.description = '';
    this.icon_url = '';
    this.website = '';
    this.discord = '';
    this.element = '';
    this.telegram = '';
    this.github = '';
    this.uploadInProgress = false;
  }

  view() {
    return (
      <div class="CommunityMetadataManagementTable">
        <Table
          bordered={false}
          interactive={false}
          striped={false}
          class="metadata-management-table"
        >
          <InputPropertyRow
            title="Name"
            defaultValue={this.name}
            onChangeHandler={(v) => {
              this.name = v;
              this.id = slugify(v);
            }}
          />
          <InputPropertyRow
            title="ID"
            defaultValue={this.id}
            value={this.id}
            onChangeHandler={(v) => {
              this.id = v;
            }}
          />
          <InputPropertyRow
            title="Symbol"
            defaultValue={this.symbol}
            onChangeHandler={(v) => {
              this.symbol = v;
            }}
          />
          <SelectPropertyRow
            title="Base Chain"
            options={['cosmos', 'ethereum', 'near']}
            value={this.base}
            onchange={(value) => {
              this.base = value;
            }}
          />
        </Table>
        {...defaultChainRows(this)}
        <CWButton
          class="mt-3"
          label="Save changes"
          buttonType="primary"
          disabled={this.saving}
          onclick={async () => {
            const {
              id,
              name,
              description,
              icon_url,
              website,
              discord,
              element,
              telegram,
              github,
              symbol,
            } = this;

            this.saving = true;
            const additionalArgs: {
              eth_chain_id?: number;
              node_url?: string;
              bech32_prefix?: string;
            } = {};

            // defaults to be overridden when chain is no longer "offchain" type
            switch (this.base) {
              case ChainBase.CosmosSDK: {
                additionalArgs.node_url = 'https://rpc-osmosis.keplr.app';
                additionalArgs.bech32_prefix = 'osmo';
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
                  'wss://eth-mainnet.alchemyapi.io/v2/cNC4XfxR7biwO2bfIO5aKcs9EMPxTQfr';
                break;
              }
            }
            try {
              const res = await $.post(`${app.serverUrl()}/createChain`, {
                address: '',
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
                jwt: app.user.jwt,
                type: ChainType.Offchain,
                base: this.base,
                network: baseToNetwork(this.base),
                ...additionalArgs,
              });
              await initAppState(false);
              m.route.set(`/${res.result.chain?.id}`);
            } catch (err) {
              notifyError(
                err.responseJSON?.error ||
                  'Creating new offchain community failed'
              );
            } finally {
              this.saving = false;
            }
          }}
        />
      </div>
    );
  }
}
