import 'pages/create_community.scss';

import m from 'mithril';
import app from 'state';
import { Table, Button } from 'construct-ui';
import $ from 'jquery';
import { initAppState } from 'app';
import { slugify } from 'utils';
import { ChainBase, ChainNetwork, ChainType } from 'types';
import { isAddress } from 'web3-utils';
import Web3 from 'web3';
import { IAaveGovernanceV2__factory } from 'eth/types';
import { notifyError } from 'controllers/app/notifications';
import {
  InputPropertyRow, SelectPropertyRow
} from 'views/components/metadata_rows';
import CompoundAPI, { GovernorTokenType, GovernorType } from 'controllers/chain/ethereum/compound/api';
import AaveApi from 'controllers/chain/ethereum/aave/api';
import { initChainForm, defaultChainRows, EthChainAttrs, EthFormState, ethChainRows } from './chain_input_rows';

type EthDaoFormAttrs = EthChainAttrs;

interface EthDaoFormState extends EthFormState {
  token_name: string;
  id: string;
  name: string;
  symbol: string;
  network: ChainNetwork.Aave | ChainNetwork.Compound,
  saving: boolean;
  loading: boolean;
  status: string;
  error: string;
}

const EthDaoForm: m.Component<EthDaoFormAttrs, EthDaoFormState> = {
  oninit: (vnode) => {
    vnode.state.chain_string = 'Ethereum Mainnet';
    vnode.state.chain_id = '1';
    vnode.state.url = vnode.attrs.ethChains[1].url;
    vnode.state.address = '';
    vnode.state.token_name = 'token';
    vnode.state.id = '';
    vnode.state.name = '';
    vnode.state.symbol = '';
    vnode.state.network = ChainNetwork.Compound;
    initChainForm(vnode.state);
    vnode.state.saving = false;
    vnode.state.loaded = false;
    vnode.state.loading = false;
    vnode.state.status = '';
    vnode.state.error = '';
  },
  view: (vnode) => {
    const validAddress = isAddress(vnode.state.address);
    const disableField = !validAddress || !vnode.state.loaded;

    const updateDAO = async () => {
      if (!vnode.state.address || !vnode.state.chain_id || !vnode.state.url) return;
      vnode.state.loading = true;
      vnode.state.status = '';
      vnode.state.error = '';
      try {
        if (vnode.state.network === ChainNetwork.Compound) {
          const provider = new Web3.providers.WebsocketProvider(vnode.state.url);
          const compoundApi = new CompoundAPI(
            null,
            vnode.state.address,
            provider,
          );
          await compoundApi.init(vnode.state.token_name);
          if (!compoundApi.Token) {
            throw new Error('Could not find governance token. Is "Token Name" field valid?');
          }
          const govType = GovernorType[compoundApi.govType];
          const tokenType = GovernorTokenType[compoundApi.tokenType];
          vnode.state.status = `Found ${govType} with token type ${tokenType}`;
        } else if (vnode.state.network === ChainNetwork.Aave) {
          const provider = new Web3.providers.WebsocketProvider(vnode.state.url);
          const aaveApi = new AaveApi(
            IAaveGovernanceV2__factory.connect,
            vnode.state.address,
            provider,
          );
          await aaveApi.init();
          vnode.state.status = `Found Aave type DAO`;
        } else {
          throw new Error('invalid chain network');
        }
      } catch (e) {
        vnode.state.error = e.message;
        vnode.state.loading = false;
        m.redraw();
        return;
      }
      vnode.state.loaded = true;
      vnode.state.loading = false;
      m.redraw();
    }

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
          ...ethChainRows(vnode.attrs, vnode.state),
          m(SelectPropertyRow, {
            title: 'DAO Type',
            options: [ChainNetwork.Aave, ChainNetwork.Compound],
            value: vnode.state.network,
            onchange: (value) => {
              vnode.state.network = value;
              vnode.state.loaded = false;
            },
          }),
          vnode.state.network === ChainNetwork.Compound && m(InputPropertyRow, {
            title: 'Token Name (Case Sensitive)',
            defaultValue: vnode.state.token_name,
            onChangeHandler: (v) => {
              vnode.state.token_name = v;
              vnode.state.loaded = false;
            },
          }),
          m('tr', [
            m('td', { class: 'title-column', }, ''),
            m(Button, {
              label: 'Test contract',
              intent: 'primary',
              disabled: vnode.state.saving || !validAddress || !vnode.state.chain_id || vnode.state.loading,
              onclick: async (e) => {
                await updateDAO();
              },
            }),
          ]),
          vnode.state.error && m('tr', [
            m('td', { class: 'title-column', }, 'Error'),
            m('td', { class: 'error-column' }, vnode.state.error),
          ]),
          vnode.state.status && m('tr', [
            m('td', { class: 'title-column', }, 'Test Status'),
            m('td', { class: 'status-column' }, `${vnode.state.status}`),
          ]),
          m(InputPropertyRow, {
            title: 'Name',
            defaultValue: vnode.state.name,
            disabled: disableField,
            onChangeHandler: (v) => {
              vnode.state.name = v;
              vnode.state.id = slugify(v);
            },
          }),
          m(InputPropertyRow, {
            title: 'ID',
            defaultValue: vnode.state.id,
            value: vnode.state.id,
            disabled: disableField,
            onChangeHandler: (v) => {
              vnode.state.id = v;
            },
          }),
          m(InputPropertyRow, {
            title: 'Symbol',
            disabled: disableField,
            defaultValue: vnode.state.symbol,
            placeholder: 'XYZ',
            onChangeHandler: (v) => {
              vnode.state.symbol = v;
            },
          }),
          ...defaultChainRows(vnode.state, disableField),
        ]
      ),
      m(Button, {
        class: 'mt-3',
        label: 'Save changes',
        intent: 'primary',
        disabled: vnode.state.saving || !validAddress || !vnode.state.loaded,
        onclick: async (e) => {
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
            token_name,
            url,
          } = vnode.state;
          vnode.state.saving = true;
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
              jwt: app.user.jwt,
              type: ChainType.DAO,
              base: ChainBase.Ethereum,
              network: vnode.state.network,
              token_name,
              node_url: url,
              eth_chain_id: +chain_id,
            });
            await initAppState(false);
            // TODO: notify about needing to run event migration
            m.route.set(`/${res.result.chain?.id}`);
          } catch (err) {
            notifyError(
              err.responseJSON?.error ||
              'Creating new ETH DAO community failed'
            );
          } finally {
            vnode.state.saving = false;
          }
        },
      }),
    ]);
  },
};

export default EthDaoForm;
