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

//
// TODO: populate additional fields
//

type EthDaoFormAttrs = Record<string, unknown>;

interface EthDaoFormState extends ChainFormState {
  id: string;
  name: string;
  saving: boolean;
  loaded: boolean;
  error: string;
}

const EthDaoForm: m.Component<EthDaoFormAttrs, EthDaoFormState> = {
  oninit: (vnode) => {
    vnode.state.id = '';
    vnode.state.name = '';
    initChainForm(vnode.state);
    vnode.state.saving = false;
    vnode.state.loaded = false;
    vnode.state.error = '';
  },
  view: (vnode) => {
    return m('.eth-dao-creation-form', [
      m('.CommunityMetadataManagementTable', [
        m(
          Table,
          {
            bordered: false,
            interactive: false,
            striped: false,
            class: 'metadata-management-table',
          },
          [
            // TODO: fields
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
              disabled: true,
              value: vnode.state.id,
              onChangeHandler: (v) => {
                vnode.state.id = v;
              },
            }),
            ...defaultChainRows(vnode.state),
          ]
        ),
        m(Button, {
          label: 'Test fields',
          intent: 'primary',
          disabled: vnode.state.saving,
          onclick: async (e) => {
            // TODO
          },
        }),
        m(Button, {
          class: 'mt-3',
          label: 'Save changes',
          intent: 'primary',
          disabled: vnode.state.saving || !vnode.state.loaded,
          onclick: async (e) => {
            const {
              // TODO: fields
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
                // TODO: fields
                id,
                name,
                description,
                icon_url,
                website,
                discord,
                element,
                telegram,
                github,
                jwt: app.user.jwt,
                type: ChainType.DAO,
                base: ChainBase.Ethereum,
                network: ChainNetwork.Aave, // TODO: support Comp/Oz/etc
              });
              await initAppState(false);
              m.route.set(`/${res.result.chain?.id}`);
            } catch (err) {
              notifyError(
                err.responseJSON?.error ||
                'Creating new Cosmos community failed'
              );
            } finally {
              vnode.state.saving = false;
            }
          },
        }),
      ]),
    ]);
  },
};

export default EthDaoForm;