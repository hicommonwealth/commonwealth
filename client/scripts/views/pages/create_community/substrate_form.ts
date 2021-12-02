import 'pages/create_community.scss';

import m from 'mithril';
import app from 'state';
import { Table, Button } from 'construct-ui';
import $ from 'jquery';
import { initAppState } from 'app';
import { slugify } from 'utils';
import { ChainBase, ChainType } from 'types';
import { ApiPromise, WsProvider } from '@polkadot/api';
import { constructSubstrateUrl } from 'substrate';
import { notifyError, notifySuccess } from 'controllers/app/notifications';
import {
  InputPropertyRow,
} from 'views/components/metadata_rows';
import { ChainFormState, initChainForm, defaultChainRows } from './chain_input_rows';

type SubstrateFormAttrs = Record<string, unknown>;

interface SubstrateFormState extends ChainFormState {
  name: string;
  nodeUrl: string;
  symbol: string;
  substrate_spec: string;
  saving: boolean;
}

const SubstrateForm: m.Component<SubstrateFormAttrs, SubstrateFormState> = {
  oninit: (vnode) => {
    vnode.state.name = '';
    vnode.state.nodeUrl = '';
    vnode.state.symbol = '';
    initChainForm(vnode.state);
    vnode.state.substrate_spec = '';
    vnode.state.saving = false;
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
            },
          }),
          m(InputPropertyRow, {
            title: 'Node URL',
            defaultValue: vnode.state.nodeUrl,
            placeholder: 'wss://',
            onChangeHandler: (v) => {
              vnode.state.nodeUrl = v;
            },
          }),
          m(InputPropertyRow, {
            title: 'Symbol',
            defaultValue: vnode.state.symbol,
            placeholder: 'XYZ',
            onChangeHandler: (v) => {
              vnode.state.symbol = v;
            },
          }),
          m(InputPropertyRow, {
            title: 'Spec (JSON)',
            defaultValue: vnode.state.substrate_spec,
            // TODO: how to make this resizable vertically?
            //   looks like CUI specifies an !important height tag, which prevents this
            textarea: true,
            placeholder:
              '{"types": {"Address": "MultiAddress", "ChainId": "u8", "Reveals": "Vec<(AccountId, Vec<VoteOutcome>)>", "Balance2": "u128", "VoteData": {"stage": "VoteStage", "initiator": "AccountId", "vote_type": "VoteType", "tally_type": "TallyType", "is_commit_reveal": "bool"}, "VoteType": {"_enum": ["Binary", "MultiOption", "RankedChoice"]}, "TallyType": {"_enum": ["OnePerson", "OneCoin"]}, "VoteStage": {"_enum": ["PreVoting", "Commit", "Voting", "Completed"]}, "ResourceId": "[u8; 32]", "VoteRecord": {"id": "u64", "data": "VoteData", "reveals": "Reveals", "outcomes": "Vec<VoteOutcome>", "commitments": "Commitments"}, "AccountInfo": "AccountInfoWithRefCount", "Commitments": "Vec<(AccountId, VoteOutcome)>", "VoteOutcome": "[u8; 32]", "VotingTally": "Option<Vec<(VoteOutcome, u128)>>", "DepositNonce": "u64", "LookupSource": "MultiAddress", "ProposalTitle": "Bytes", "ProposalVotes": {"staus": "ProposalStatus", "expiry": "BlockNumber", "votes_for": "Vec<AccountId>", "votes_against": "Vec<AccountId>"}, "ProposalRecord": {"index": "u32", "stage": "VoteStage", "title": "Text", "author": "AccountId", "vote_id": "u64", "contents": "Text", "transition_time": "u32"}, "ProposalStatus": {"_enum": ["Initiated", "Approved", "Rejected"]}, "ProposalContents": "Bytes"}}',
            onChangeHandler: (v) => {
              vnode.state.substrate_spec = v;
            },
          }),
          m('tr', [
            m('td', { class: 'title-column', }, ''),
            m(Button, {
              label: 'Test Connection',
              onclick: async (e) => {
                // deinit substrate API if one exists
                if (app.chain?.apiInitialized) {
                  await app.chain.deinit();
                }

                // create new API
                const provider = new WsProvider(
                  constructSubstrateUrl(vnode.state.nodeUrl),
                  false
                );
                try {
                  await provider.connect();
                  const api = await ApiPromise.create({
                    throwOnConnect: true,
                    provider,
                    ...JSON.parse(vnode.state.substrate_spec),
                  });
                  await api.disconnect();
                  notifySuccess('Test has passed');
                } catch (err) {
                  console.error(err.message);
                  notifyError('Test API initialization failed');
                }
              },
            }),
          ]),
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
            nodeUrl,
            symbol,
            icon_url,
            website,
            discord,
            element,
            telegram,
            github,
            substrate_spec,
          } = vnode.state;
          try {
            JSON.parse(substrate_spec);
          } catch (err) {
            notifyError('Spec provided has invalid JSON');
            return;
          }
          vnode.state.saving = true;
          $.post(`${app.serverUrl()}/addChainNode`, {
            name,
            description,
            node_url: nodeUrl,
            icon_url,
            symbol,
            website,
            discord,
            element,
            telegram,
            github,
            substrate_spec,
            jwt: app.user.jwt,
            type: ChainType.Chain,
            id: slugify(name),
            base: ChainBase.Substrate,
            network: slugify(name),
          })
            .then(async (res) => {
              await initAppState(false);
              m.route.set(`/${res.result.chain}`);
            })
            .catch((err: any) => {
              notifyError(
                err.responseJSON?.error || 'Creating new community failed'
              );
            })
            .always(() => {
              vnode.state.saving = false;
            });
        },
      }),
    ]);
  },
};

export default SubstrateForm;