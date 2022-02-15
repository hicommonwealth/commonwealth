/* @jsx m */

import m from 'mithril';
import $ from 'jquery';
// import { connect as nearConnect, ConnectConfig, keyStores } from 'near-api-js';
// import { CodeResult } from 'near-api-js/lib/providers/provider';

import 'pages/create_community_test.scss';

import app from 'state';
import { initAppState } from 'app';
import { ChainBase, ChainNetwork, ChainType } from 'types';
import { notifyError } from 'controllers/app/notifications';
import { InputRow, ToggleRow } from 'views/components/metadata_rows';
import { initChainForm, defaultChainRows } from './chain_input_rows';
import { ChainFormFields, ChainFormState } from './types';
import { CWButton } from '../../components/component_kit/cw_button';

type CreateSputnikForm = ChainFormFields & { isMainnet: boolean };

type CreateSputnikState = ChainFormState & { form: CreateSputnikForm };

export class SputnikForm implements m.ClassComponent {
  private state: CreateSputnikState = {
    saving: false,
    form: {
      name: '',
      isMainnet: true,
      ...initChainForm(),
    },
  };

  view(vnode) {
    return (
      <div class="CreateCommunityForm">
        <InputRow
          title="DAO Name"
          defaultValue={this.state.form.name}
          onChangeHandler={(v) => {
            this.state.form.name = v.toLowerCase();
          }}
          placeholder="genesis"
        />
        <ToggleRow
          title="Network"
          defaultValue={this.state.form.isMainnet}
          onToggle={(checked) => {
            vnode.state.isMainnet = checked;
          }}
          label={(checked) => {
            if (checked !== this.state.form.isMainnet) {
              return 'Unknown network!';
            }
            return checked ? 'Mainnet' : 'Testnet';
          }}
        />
        {/* TODO: add divider to distinguish on-chain data */}
        {...defaultChainRows(this.state.form)}
        <CWButton
          label="Save changes"
          buttonType="primary"
          disabled={this.state.saving}
          onclick={async () => {
            const {
              name,
              description,
              icon_url,
              website,
              discord,
              element,
              telegram,
              github,
            } = this.state.form;

            this.state.saving = true;

            const isMainnet = this.state.form.isMainnet;

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
              // Gabe 2/14/22 Commenting this bit out because it isn't actually used, but maybe it will be someday?
              //
              // verify the DAO exists
              //   const config: ConnectConfig = {
              //     networkId: isMainnet ? 'mainnet' : 'testnet',
              //     nodeUrl: url,
              //     keyStore: new keyStores.BrowserLocalStorageKeyStore(
              //       localStorage
              //     ),
              //   };
              //   const api = await nearConnect(config);

              //   const rawResult = await api.connection.provider.query<CodeResult>(
              //     {
              //       request_type: 'call_function',
              //       account_id: id,
              //       method_name: 'get_last_proposal_id',
              //       args_base64: Buffer.from(JSON.stringify({})).toString(
              //         'base64'
              //       ),
              //       finality: 'optimistic',
              //     }
              //   );
              //   const _validResponse = JSON.parse(
              //     Buffer.from(rawResult.result).toString()
              //   );

              // POST object
              const res = await $.post(
                `${app.serverUrl()}/addChainNode`,
                addChainNodeArgs
              );
              await initAppState(false);
              m.route.set(`${window.location.origin}/${res.result.chain}`);
            } catch (err) {
              notifyError(err.responseJSON?.error || 'Adding DAO failed.');
              console.error(err.responseJSON?.error || err.message);
              this.state.saving = false;
            }
          }}
        />
      </div>
    );
  }
}
