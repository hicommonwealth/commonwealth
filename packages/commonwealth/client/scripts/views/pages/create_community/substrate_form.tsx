import React, { useState } from 'react';
import $ from 'jquery';

import 'pages/create_community.scss';

import app from 'state';
import { initAppState } from 'state';
import { ChainBase, ChainType } from 'common-common/src/types';
import { linkExistingAddressToChainOrCommunity } from 'controllers/app/login';
import { notifyError, notifySuccess } from 'controllers/app/notifications';
import { constructSubstrateUrl } from 'substrate';
import { slugify } from 'utils';
import { InputRow } from 'views/components/metadata_rows';
import { CWButton } from '../../components/component_kit/cw_button';
import {
  defaultCommunityRows,
  updateAdminOnCreateCommunity,
} from './community_input_rows';
import { useCommonNavigate } from 'navigation/helpers';
import {
  useCommunityFormIdFields,
  useCommunityFormDefaultFields,
  useCommunityFormState,
  useEthCommunityFormFields,
} from './hooks';

const defaultSubstrateSpec = `{"types": {"Address": "MultiAddress", "ChainId": "u8",
"Reveals": "Vec<(AccountId, Vec<VoteOutcome>)>", "Balance2": "u128",
"VoteData": {"stage": "VoteStage", "initiator": "AccountId", "vote_type":
"VoteType", "tally_type": "TallyType", "is_commit_reveal": "bool"},
"VoteType": {"_enum": ["Binary", "MultiOption", "RankedChoice"]},
"TallyType": {"_enum": ["OnePerson", "OneCoin"]}, "VoteStage": {"_enum":
["PreVoting", "Commit", "Voting", "Completed"]}, "ResourceId": "[u8; 32]",
"VoteRecord": {"id": "u64", "data": "VoteData", "reveals": "Reveals",
"outcomes": "Vec<VoteOutcome>", "commitments": "Commitments"}, "AccountInfo":
"AccountInfoWithRefCount", "Commitments": "Vec<(AccountId, VoteOutcome)>",
"VoteOutcome": "[u8; 32]", "VotingTally": "Option<Vec<(VoteOutcome, u128)>>",
"DepositNonce": "u64", "LookupSource": "MultiAddress", "ProposalTitle": "Bytes",
"ProposalVotes": {"staus": "ProposalStatus", "expiry": "BlockNumber",
"votes_for": "Vec<AccountId>", "votes_against": "Vec<AccountId>"}, "ProposalRecord":
{"index": "u32", "stage": "VoteStage", "title": "Text", "author": "AccountId",
"vote_id": "u64", "contents": "Text", "transition_time": "u32"}, "ProposalStatus":
{"_enum": ["Initiated", "Approved", "Rejected"]}, "ProposalContents": "Bytes"}}`;

export const SubstrateForm = () => {
  const [substrateSpec, setSubstrateSpec] = useState('');

  const { name, setName, symbol, setSymbol } = useCommunityFormIdFields();

  const communityFormDefaultFields = useCommunityFormDefaultFields();

  const communityFormState = useCommunityFormState();

  const ethCommunityFormFields = useEthCommunityFormFields();

  const navigate = useCommonNavigate();

  return (
    <div className="CreateCommunityForm">
      <InputRow
        title="Name"
        value={name}
        onChangeHandler={(v) => {
          setName(v);
        }}
      />
      <InputRow
        title="Node URL"
        value={ethCommunityFormFields.nodeUrl}
        placeholder="wss://"
        onChangeHandler={(v) => {
          ethCommunityFormFields.setNodeUrl(v);
        }}
      />
      <InputRow
        title="Symbol"
        value={symbol}
        placeholder="XYZ"
        onChangeHandler={(v) => {
          setSymbol(v);
        }}
      />
      <InputRow
        title="Spec (JSON)"
        value={substrateSpec}
        // TODO: how to make this resizable vertically?
        //   looks like CUI specifies an !important height tag, which prevents this
        textarea
        placeholder={defaultSubstrateSpec}
        onChangeHandler={(v) => {
          setSubstrateSpec(v);
        }}
      />
      <CWButton
        label="Test Connection"
        className="button-margin-bottom"
        onClick={async () => {
          // deinit substrate API if one exists
          if (app.chain?.apiInitialized) {
            await app.chain.deinit();
          }

          const polkadot = await import('@polkadot/api');
          // create new API
          const provider = new polkadot.WsProvider(
            constructSubstrateUrl(ethCommunityFormFields.nodeUrl),
            false
          );
          try {
            await provider.connect();
            const api = await polkadot.ApiPromise.create({
              throwOnConnect: true,
              provider,
              ...JSON.parse(substrateSpec),
            });
            await api.disconnect();
            notifySuccess('Test has passed');
          } catch (err) {
            console.error(err.message);
            notifyError('Test API initialization failed');
          }
        }}
      />
      {defaultCommunityRows(communityFormDefaultFields)}
      <CWButton
        label="Save changes"
        disabled={communityFormState.saving}
        onClick={async () => {
          try {
            JSON.parse(substrateSpec);
          } catch (err) {
            notifyError('Spec provided has invalid JSON');
            return;
          }

          communityFormState.setSaving(true);

          $.post(`${app.serverUrl()}/communities`, {
            base: ChainBase.Substrate,
            icon_url: communityFormDefaultFields.iconUrl,
            id: slugify(name),
            jwt: app.user.jwt,
            network: slugify(name),
            node_url: ethCommunityFormFields.nodeUrl,
            substrate_spec: substrateSpec,
            type: ChainType.Chain,
            default_symbol: symbol,
            // ...form, <-- not typed so I don't know what's needed
          })
            .then(async (res) => {
              if (res.result.admin_address) {
                await linkExistingAddressToChainOrCommunity(
                  res.result.admin_address,
                  res.result.role.chain_id,
                  res.result.role.chain_id
                );
              }
              await updateAdminOnCreateCommunity(slugify(name));
              navigate(`/${res.result.chain.id}`);
            })
            .catch((err: any) => {
              notifyError(
                err.responseJSON?.error || 'Creating new community failed'
              );
            })
            .always(() => {
              communityFormState.setSaving(false);
            });
        }}
      />
    </div>
  );
};
