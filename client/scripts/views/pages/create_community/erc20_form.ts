import 'pages/create_community.scss';

import m from 'mithril';
import app from 'state';
import { Table, Button } from 'construct-ui';
import $ from 'jquery';
import { initAppState } from 'app';
import { slugify } from 'utils';
import { ChainBase, ChainNetwork, ChainType } from 'types';
import { isAddress } from 'web3-utils';
import { notifyError } from 'controllers/app/notifications';
import {
  InputPropertyRow
} from 'views/components/metadata_rows';
import { EthFormState, initChainForm, defaultChainRows, EthChainAttrs, ethChainRows } from './chain_input_rows';

type ERC20FormAttrs = EthChainAttrs;

interface ERC20FormState extends EthFormState {
  id: string;
  name: string;
  symbol: string;
  decimals: number;
  saving: boolean;
  loaded: boolean;
  loading: boolean;
  error: string;
}

const ERC20Form: m.Component<ERC20FormAttrs, ERC20FormState> = {
  oninit: (vnode) => {
    vnode.state.chain_string = 'Ethereum Mainnet';
    vnode.state.chain_id = '1';
    vnode.state.url = vnode.attrs.ethChains[1];
    vnode.state.address = '';
    vnode.state.id = '';
    vnode.state.name = '';
    vnode.state.symbol = '';
    vnode.state.decimals = 18;
    initChainForm(vnode.state);
    vnode.state.saving = false;
    vnode.state.loaded = false;
    vnode.state.loading = false;
    vnode.state.error = '';
  },
  view: (vnode) => {
    const validAddress = isAddress(vnode.state.address);
    const disableField = !validAddress || !vnode.state.loaded;

    const updateTokenForum = async () => {
      if (!vnode.state.address || !vnode.state.chain_id) return;
      vnode.state.loading = true;
      const args = {
        address: vnode.state.address,
        chain_id: vnode.state.chain_id,
        allowUncached: true,
      };
      try {
        const res = await $.get(`${app.serverUrl()}/getTokenForum`, args);
        console.log(res);
        if (res.status === 'Success') {
          vnode.state.name = res?.token?.name || '';
          vnode.state.id = slugify(res?.token?.id);
          vnode.state.symbol = res?.token?.symbol || '';
          vnode.state.decimals = +res?.token?.decimals || 18;
          vnode.state.icon_url =
            res?.token?.icon_url || '';
          if (vnode.state.icon_url.startsWith('/')) {
            vnode.state.icon_url = `https://commonwealth.im${vnode.state.icon_url}`;
          }
          vnode.state.description =
            res?.token?.description || '';
          vnode.state.website = res?.token?.website || '';
          vnode.state.discord = res?.token?.discord || '';
          vnode.state.element = res?.token?.element || '';
          vnode.state.telegram =
            res?.token?.telegram || '';
          vnode.state.github = res?.token?.github || '';
          vnode.state.loaded = true;
        } else {
          notifyError(res.message);
        }
      } catch (err) {
        notifyError(
          err.responseJSON?.error ||
          'Failed to load Token Information'
        );
      }
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
          m('tr', [
            m('td', { class: 'title-column', }, ''),
            m(Button, {
              label: 'Populate fields',
              intent: 'primary',
              disabled: vnode.state.saving || !validAddress || !vnode.state.chain_id || vnode.state.loading,
              onclick: async (e) => {
                await updateTokenForum();
              },
            }),
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
            url,
            decimals,
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
              decimals,
              jwt: app.user.jwt,
              type: ChainType.Token,
              base: ChainBase.Ethereum,
              network: ChainNetwork.ERC20,
              node_url: url,
              eth_chain_id: chain_id,
            });
            await initAppState(false);
            m.route.set(`/${res.result.chain?.id}`);
          } catch (err) {
            notifyError(
              err.responseJSON?.error ||
              'Creating new ERC20 community failed'
            );
          } finally {
            vnode.state.saving = false;
          }
        },
      }),
    ]);
  },
};

export default ERC20Form;