/* @jsx m */

import m from 'mithril';
import $ from 'jquery';
import { ApiPromise, WsProvider } from '@polkadot/api';

import 'pages/create_community.scss';

import app from 'state';
import { initAppState } from 'app';
import { slugify } from 'utils';
import { ChainBase, ChainType } from 'types';
import { constructSubstrateUrl } from 'substrate';
import { notifyError, notifySuccess } from 'controllers/app/notifications';
import { InputRow } from 'views/components/metadata_rows';
import { initChainForm, defaultChainRows } from './chain_input_rows';
import { ChainFormFields, ChainFormState } from './types';
import { CWButton } from '../../components/component_kit/cw_button';
import {
  MixpanelCommunityCreationEvent,
  MixpanelCommunityCreationPayload,
} from 'analytics/types';
import { mixpanelBrowserTrack } from 'helpers/mixpanel_browser_util';

type SubstrateFormFields = {
  nodeUrl: string;
  substrateSpec: string;
};

type CreateSubstrateForm = ChainFormFields & SubstrateFormFields;

type CreateSubstrateState = ChainFormState & { form: CreateSubstrateForm };

export class SubstrateForm implements m.ClassComponent {
  private state: CreateSubstrateState = {
    saving: false,
    form: {
      name: '',
      nodeUrl: '',
      substrateSpec: '',
      symbol: '',
      ...initChainForm(),
    },
  };

  view() {
    return (
      <div class="CreateCommunityForm">
        <InputRow
          title="Name"
          defaultValue={this.state.form.name}
          onChangeHandler={(v) => {
            this.state.form.name = v;
          }}
        />
        <InputRow
          title="Node URL"
          defaultValue={this.state.form.nodeUrl}
          placeholder="wss://"
          onChangeHandler={(v) => {
            this.state.form.nodeUrl = v;
          }}
        />
        <InputRow
          title="Symbol"
          defaultValue={this.state.form.symbol}
          placeholder="XYZ"
          onChangeHandler={(v) => {
            this.state.form.symbol = v;
          }}
        />
        <InputRow
          title="Spec (JSON)"
          defaultValue={this.state.form.substrateSpec}
          // TODO: how to make this resizable vertically?
          //   looks like CUI specifies an !important height tag, which prevents this
          textarea={true}
          placeholder='{"types": {"Address": "MultiAddress", "ChainId": "u8", "Reveals": "Vec<(AccountId, Vec<VoteOutcome>)>", "Balance2": "u128", "VoteData": {"stage": "VoteStage", "initiator": "AccountId", "vote_type": "VoteType", "tally_type": "TallyType", "is_commit_reveal": "bool"}, "VoteType": {"_enum": ["Binary", "MultiOption", "RankedChoice"]}, "TallyType": {"_enum": ["OnePerson", "OneCoin"]}, "VoteStage": {"_enum": ["PreVoting", "Commit", "Voting", "Completed"]}, "ResourceId": "[u8; 32]", "VoteRecord": {"id": "u64", "data": "VoteData", "reveals": "Reveals", "outcomes": "Vec<VoteOutcome>", "commitments": "Commitments"}, "AccountInfo": "AccountInfoWithRefCount", "Commitments": "Vec<(AccountId, VoteOutcome)>", "VoteOutcome": "[u8; 32]", "VotingTally": "Option<Vec<(VoteOutcome, u128)>>", "DepositNonce": "u64", "LookupSource": "MultiAddress", "ProposalTitle": "Bytes", "ProposalVotes": {"staus": "ProposalStatus", "expiry": "BlockNumber", "votes_for": "Vec<AccountId>", "votes_against": "Vec<AccountId>"}, "ProposalRecord": {"index": "u32", "stage": "VoteStage", "title": "Text", "author": "AccountId", "vote_id": "u64", "contents": "Text", "transition_time": "u32"}, "ProposalStatus": {"_enum": ["Initiated", "Approved", "Rejected"]}, "ProposalContents": "Bytes"}}'
          onChangeHandler={(v) => {
            this.state.form.substrateSpec = v;
          }}
        />
        <CWButton
          label="Test Connection"
          className="button-margin-bottom"
          onclick={async () => {
            // deinit substrate API if one exists
            if (app.chain?.apiInitialized) {
              await app.chain.deinit();
            }

            // create new API
            const provider = new WsProvider(
              constructSubstrateUrl(this.state.form.nodeUrl),
              false
            );
            try {
              await provider.connect();
              const api = await ApiPromise.create({
                throwOnConnect: true,
                provider,
                ...JSON.parse(this.state.form.substrateSpec),
              });
              await api.disconnect();
              notifySuccess('Test has passed');
            } catch (err) {
              console.error(err.message);
              notifyError('Test API initialization failed');
            }
          }}
        />
        {...defaultChainRows(this.state.form)}
        <CWButton
          label="Save changes"
          disabled={this.state.saving}
          onclick={async () => {
            const { name, nodeUrl, iconUrl, substrateSpec } = this.state.form;
            mixpanelBrowserTrack({
              event: MixpanelCommunityCreationEvent.CREATE_COMMUNITY_ATTEMPTED,
              chainBase: null,
              isCustomDomain: app.isCustomDomain(),
              communityType: null,
            });
            try {
              JSON.parse(substrateSpec);
            } catch (err) {
              notifyError('Spec provided has invalid JSON');
              return;
            }
            this.state.saving = true;
            $.post(`${app.serverUrl()}/addChainNode`, {
              base: ChainBase.Substrate,
              icon_url: iconUrl,
              id: slugify(name),
              jwt: app.user.jwt,
              network: slugify(name),
              node_url: nodeUrl,
              substrate_spec: substrateSpec,
              type: ChainType.Chain,
              ...this.state.form,
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
                this.state.saving = false;
              });
          }}
        />
      </div>
    );
  }
}
