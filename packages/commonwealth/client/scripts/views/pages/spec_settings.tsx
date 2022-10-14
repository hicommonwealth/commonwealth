/* @jsx m */

import m from 'mithril';
import $ from 'jquery';
import { ApiPromise, WsProvider } from '@polkadot/api';
import { RegisteredTypes } from '@polkadot/types/types';

import 'pages/spec_settings.scss';

import app from 'state';
import { initChain, selectChain } from 'app';
import { ChainBase } from 'common-common/src/types';
import { ChainInfo, RolePermission } from 'models';
import { constructSubstrateUrl } from 'substrate';
import { DropdownFormField } from '../components/forms';
import Sublayout from '../sublayout';
import { PageLoading } from './loading';
import { PageNotFound } from './404';
import { CWValidationText } from '../components/component_kit/cw_validation_text';
import { CWTextArea } from '../components/component_kit/cw_text_area';
import { CWButton } from '../components/component_kit/cw_button';
import { CWText } from '../components/component_kit/cw_text';

class SpecSettingsPage implements m.ClassComponent {
  private chain: string;
  private chains: string[];
  private error: string;
  private isLoading: boolean;
  private isSpecValid: boolean;
  private spec: RegisteredTypes;

  view() {
    // loading states
    const isAdmin = app.user?.isSiteAdmin;
    const roles = app.roles?.roles || [];
    const substrateAdminChainIds = roles
      .filter(
        (r) =>
          r.permission === RolePermission.admin &&
          app.config.chains.getById(r.chain_id).base === ChainBase.Substrate
      )
      .map((r) => r.chain_id);

    if (!isAdmin && !substrateAdminChainIds.length) {
      return <PageNotFound />;
    }

    if (!app.chain?.serverLoaded) {
      return <PageLoading />;
    }

    // initial configuration
    if (!this.chains) {
      // only include chains where user is admin
      this.chains = app.config.chains
        .getAll()
        .filter(
          (c) =>
            c.base === ChainBase.Substrate &&
            (isAdmin || substrateAdminChainIds.includes(c.id))
        )
        .map((c) => c.id);
    }
    if (!this.chain) {
      // if on chain where user is not community admin, select first chain in list
      // where they are admin. otherwise, select current chain.
      this.chain =
        app.chain.base === ChainBase.Substrate &&
        (isAdmin || substrateAdminChainIds.includes(app.chain.id))
          ? app.chain?.meta?.id
          : this.chains[0];
      this.spec = app.config.chains.getById(this.chain).substrateSpec || {};
    }

    return (
      <Sublayout>
        <div class="SpecSettingsPage">
          <CWText type="h3">Substrate Spec Settings</CWText>
          {m(DropdownFormField, {
            options: {
              disabled: this.isLoading,
            },
            value: this.chain,
            choices: this.chains.map((c) => ({
              name: 'chain',
              value: c,
              label: c,
            })),
            callback: (result) => {
              this.chain = result;
              this.spec = app.config.chains.getById(result).substrateSpec || {};
              this.isSpecValid = false;
              this.error = '';

              // update spec display
              m.redraw();
            },
          })}
          <CWTextArea
            disabled={this.isLoading}
            value={JSON.stringify(this.spec, null, 2)}
            oninput={(e) => {
              // TODO: support tabs / auto-alignment / syntax highlighting
              const result = (e.target as any).value;
              if (result !== this.spec) {
                this.isSpecValid = false;
                let specJson;
                try {
                  specJson = JSON.parse(result);
                  this.error = '';
                } catch (err) {
                  this.error = 'Invalid spec.';
                  return;
                }
                this.spec = specJson;
                m.redraw();
              }
            }}
          />
          {this.error && (
            <CWValidationText message={this.error} status="failure" />
          )}
          <CWButton
            label="Test"
            disabled={this.isLoading || !!this.error}
            onclick={async () => {
              this.error = '';

              // deinit substrate API if one exists
              if (app.chain.apiInitialized) {
                await app.chain.deinit();
              }

              // get URL as needed
              const node = app.chain.meta.node;
              if (!node) {
                this.error = 'Chain has no nodes!';
                return;
              }

              // create new API
              this.isLoading = true;
              const provider = new WsProvider(
                constructSubstrateUrl(node.url),
                false
              );
              try {
                await provider.connect();
                const api = await ApiPromise.create({
                  throwOnConnect: true,
                  provider,
                  ...this.spec,
                });
                const version = api.runtimeVersion;
                const props = await api.rpc.system.properties();
                console.log(
                  `Fetched version: ${version.specName}:${
                    version.specVersion
                  } and properties ${JSON.stringify(props)}`
                );
                this.isSpecValid = true;
                await api.disconnect();
              } catch (e) {
                console.error(e.message);
                this.error = 'API initialization failed.';
              }
              this.isLoading = false;
              m.redraw();
            }}
          />
          <CWButton
            label="Submit"
            disabled={!this.isSpecValid || this.isLoading || !!this.error}
            onclick={async () => {
              this.isLoading = true;
              let response;
              try {
                response = await $.post(
                  `${app.serverUrl()}/editSubstrateSpec`,
                  {
                    jwt: app.user.jwt,
                    address: app.user.activeAccount.address,
                    chain: this.chain,
                    spec: JSON.stringify(this.spec),
                  }
                );
              } catch (err) {
                this.error = err.message || 'Spec update failure.';
                this.isLoading = false;
                m.redraw();
                return;
              }

              // update stored spec
              if (response.status === 'Success') {
                const newChain = ChainInfo.fromJSON(response.result);
                app.config.chains.update(newChain);

                // reinitialize chain with new spec if editing current chain
                if (app.chain?.id === newChain.id) {
                  await selectChain(newChain);
                  await initChain();
                }
              }

              this.isLoading = false;
              m.redraw();
            }}
          />
        </div>
      </Sublayout>
    );
  }
}

export default SpecSettingsPage;
