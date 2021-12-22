import 'pages/create_community.scss';

import m from 'mithril';
import app from 'state';
import { Table, Button } from 'construct-ui';
import $ from 'jquery';
import { initAppState } from 'app';
import { slugify } from 'utils';
import { ChainBase, ChainNetwork, ChainType } from 'types';
import { notifyError } from 'controllers/app/notifications';
import {
  InputPropertyRow
} from 'views/components/metadata_rows';
import { ChainFormState, initChainForm, defaultChainRows } from './chain_input_rows';

type OffchainFormAttrs = Record<string, unknown>;

interface OffchainFormState extends ChainFormState {
  id: string;
  name: string;
  saving: boolean;
  loaded: boolean;
  loading: boolean;
  status: string;
  error: string;
}

const OffchainForm: m.Component<OffchainFormAttrs, OffchainFormState> = {
  oninit: (vnode) => {
    vnode.state.id = '';
    vnode.state.name = '';
    initChainForm(vnode.state);
    vnode.state.saving = false;
    vnode.state.loaded = false;
    vnode.state.loading = false;
    vnode.state.status = '';
    vnode.state.error = '';
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
            title: 'Name',
            defaultValue: vnode.state.name,
            onChangeHandler: (v) => {
              vnode.state.name = v;
              vnode.state.id = slugify(v);
            },
          }),
          m(InputPropertyRow, {
            title: 'ID',
            defaultValue: vnode.state.id,
            value: vnode.state.id,
            onChangeHandler: (v) => {
              vnode.state.id = v;
            },
          }),
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
            id,
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
          try {
            const res = await $.post(`${app.serverUrl()}/createChain`, {
              address: '',
              id,
              name,
              description,
              icon_url,
              symbol: 'ETH',
              website,
              discord,
              element,
              telegram,
              github,
              jwt: app.user.jwt,
              type: ChainType.Offchain,
              base: ChainBase.Ethereum,
              network: ChainNetwork.Ethereum,
              node_url: 'wss://eth-mainnet.alchemyapi.io/v2/cNC4XfxR7biwO2bfIO5aKcs9EMPxTQfr',
              eth_chain_id: 1,
            });
            await initAppState(false);
            m.route.set(`/${res.result.chain?.id}`);
          } catch (err) {
            notifyError(
              err.responseJSON?.error ||
              'Creating new offchain community failed'
            );
          } finally {
            vnode.state.saving = false;
          }
        },
      }),
    ]);
  },
};

export default OffchainForm;
