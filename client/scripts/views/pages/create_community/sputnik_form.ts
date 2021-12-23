import 'pages/create_community.scss';

import { connect as nearConnect, ConnectConfig, keyStores } from 'near-api-js';
import { CodeResult } from 'near-api-js/lib/providers/provider';
import m from 'mithril';
import app from 'state';
import { Table, Button } from 'construct-ui';
import $ from 'jquery';
import { initAppState } from 'app';
import { ChainBase, ChainNetwork, ChainType } from 'types';
import { notifyError } from 'controllers/app/notifications';
import {
  InputPropertyRow, TogglePropertyRow,
} from 'views/components/metadata_rows';
import { ChainFormState, initChainForm, defaultChainRows } from './chain_input_rows';

type SputnikFormAttrs = Record<string, unknown>;

interface SputnikFormState extends ChainFormState {
  name: string;
  saving: boolean;
  isMainnet: boolean;
}

const SputnikForm: m.Component<SputnikFormAttrs, SputnikFormState> = {
  oninit: (vnode) => {
    vnode.state.name = '';
    initChainForm(vnode.state);
    vnode.state.saving = false;
    vnode.state.isMainnet = true;
  },
  view: (vnode) => {
    return m('.CommunityMetadataManagementTable', [
      m(
        Table,
        {
          bordered: false,
          interactive: false,
          striped: false,
          class: 'metadata-management-table',
        },
        [
          m(InputPropertyRow, {
            title: 'DAO Name',
            defaultValue: vnode.state.name,
            onChangeHandler: (v) => {
              vnode.state.name = v.toLowerCase();
            },
            placeholder: 'genesis',
          }),
          m(TogglePropertyRow, {
            title: 'Network',
            defaultValue: vnode.state.isMainnet,
            onToggle: (checked) => {
              vnode.state.isMainnet = checked;
            },
            caption: (checked) => {
              if (checked !== vnode.state.isMainnet) {
                return 'Unknown network!';
              }
              return checked ? 'Mainnet' : 'Testnet';
            },
          }),
          // TODO: add divider to distinguish on-chain data
          ...defaultChainRows(vnode.state),
        ]
      ),
      m(Button, {
        class: 'mt-3',
        label: 'Save changes',
        intent: 'primary',
        disabled: vnode.state.saving,
        onclick: async (e) => {
          const {
            name,
            description,
            icon_url,
            website,
            discord,
            element,
            telegram,
            github,
          } = vnode.state;
          vnode.state.saving = true;
          const isMainnet = vnode.state.isMainnet;
          const id = isMainnet
            ? `${name}.sputnik-dao.near`
            : `${name}.sputnikv2.testnet`;
          const url = isMainnet
            ? 'https://rpc.mainnet.near.org'
            : 'https://rpc.testnet.near.org';
          const addChainNodeArgs = {
            name: id,
            description,
            node_url: url,
            symbol: isMainnet ? 'NEAR' : 'tNEAR',
            icon_url,
            website,
            discord,
            element,
            telegram,
            github,
            jwt: app.user.jwt,
            type: ChainType.DAO,
            id,
            base: ChainBase.NEAR,
            network: ChainNetwork.Sputnik,
          };
          try {
            // verify the DAO exists
            const config: ConnectConfig = {
              networkId: isMainnet ? 'mainnet' : 'testnet',
              nodeUrl: url,
              keyStore: new keyStores.BrowserLocalStorageKeyStore(localStorage),
            };
            const api = await nearConnect(config);

            const rawResult = await api.connection.provider.query<CodeResult>({
              request_type: 'call_function',
              account_id: id,
              method_name: 'get_last_proposal_id',
              args_base64: Buffer.from(JSON.stringify({})).toString('base64'),
              finality: 'optimistic',
            });
            const _validResponse = JSON.parse(Buffer.from(rawResult.result).toString());

            // POST object
            const res = await $.post(`${app.serverUrl()}/addChainNode`, addChainNodeArgs);
            await initAppState(false);
            m.route.set(`${window.location.origin}/${res.result.chain}`);
          } catch (err) {
            notifyError(err.responseJSON?.error || 'Adding DAO failed.');
            console.error(err.responseJSON?.error || err.message);
            vnode.state.saving = false;
          }
        },
      }),
    ]);
  },
};

export default SputnikForm;