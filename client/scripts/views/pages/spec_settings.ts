import 'pages/spec_settings.scss';

import { ApiPromise, WsProvider } from '@polkadot/api';
import { RegisteredTypes } from '@polkadot/types/types';
import { initChain, selectNode } from 'app';
import { ChainBase, ChainInfo, RolePermission } from 'models';
import { Button, TextArea, Form, Grid, Col } from 'construct-ui';
import $ from 'jquery';
import m from 'mithril';
import app from 'state';
import { constructSubstrateUrl } from 'substrate';
import { DropdownFormField } from '../components/forms';
import Sublayout from '../sublayout';
import PageLoading from './loading';
import PageNotFound from './404';

interface ISpecSettingsState {
  chain: string;
  chains: string[];
  specString: string;
  spec?: RegisteredTypes;
  isSpecValid: boolean;
  isLoading: boolean;
  error: string;
}

const SpecSettingsPage: m.Component<{}, ISpecSettingsState> = {
  view: (vnode: m.VnodeDOM<{}, ISpecSettingsState>) => {
    // loading states
    const isAdmin = app.user?.isSiteAdmin;
    const roles = app.user?.roles || [];
    const substrateAdminChainIds = roles.filter((r) => r.permission === RolePermission.admin
      && app.config.chains.getById(r.chain_id).base === ChainBase.Substrate)
      .map((r) => r.chain_id);
    if (!isAdmin && !substrateAdminChainIds.length) {
      return m(PageNotFound);
    }
    if (!app.chain?.serverLoaded) {
      return m(PageLoading);
    }

    // initial configuration
    if (!vnode.state.chains) {
      // only include chains where user is admin
      vnode.state.chains = app.config.chains.getAll()
        .filter((c) => c.base === ChainBase.Substrate
          && (isAdmin || substrateAdminChainIds.includes(c.id)))
        .map((c) => c.id);
    }
    if (!vnode.state.chain) {
      // if on chain where user is not community admin, select first chain in list
      // where they are admin. otherwise, select current chain.
      vnode.state.chain = (app.chain.base === ChainBase.Substrate
          && (isAdmin || substrateAdminChainIds.includes(app.chain.id)))
        ? app.chain?.meta?.chain.id
        : vnode.state.chains[0];
      vnode.state.spec = app.config.chains.getById(vnode.state.chain).substrateSpec || {};
    }

    return m(Sublayout, {
      class: 'SpecSettingsPage',
    }, [
      m(Form, { class: 'SpecSettingsForm' }, [
        m(Grid, [
          m(Col, { class: 'form-col' }, [
            m('h3', 'Substrate Spec Settings'),

            // Dropdown to select chain + reload spec
            m(DropdownFormField, {
              options: {
                disabled: vnode.state.isLoading,
              },
              value: vnode.state.chain,
              choices: vnode.state.chains.map(
                (c) => ({ name: 'chain', value: c, label: c })
              ),
              callback: (result) => {
                vnode.state.chain = result;
                vnode.state.spec = app.config.chains.getById(result).substrateSpec || {};
                vnode.state.isSpecValid = false;
                vnode.state.error = '';

                // update spec display
                m.redraw();
              },
            }),

            // editable display of spec
            m(TextArea, {
              disabled: vnode.state.isLoading,
              class: 'spec',
              defaultValue: JSON.stringify(vnode.state.spec, null, 2),
              oninput: (e) => {
                // TODO: support tabs / auto-alignment / syntax highlighting
                const result = (e.target as any).value;
                if (result !== vnode.state.spec) {
                  vnode.state.isSpecValid = false;
                  let specJson;
                  try {
                    specJson = JSON.parse(result);
                    vnode.state.error = '';
                  } catch (err) {
                    vnode.state.error = 'Invalid spec.';
                    return;
                  }
                  vnode.state.spec = specJson;
                  m.redraw();
                }
              },
            }),

            // error output
            vnode.state.error && m('.warn', vnode.state.error),

            // test button
            m(Button, {
              label: 'Test',
              rounded: true,
              disabled: vnode.state.isLoading || !!vnode.state.error,
              onclick: async () => {
                vnode.state.error = '';

                // deinit substrate API if one exists
                if (app.chain.apiInitialized) {
                  await app.chain.deinit();
                }

                // get URL as needed
                const nodes = app.config.nodes.getByChain(vnode.state.chain);
                if (!nodes.length) {
                  vnode.state.error = 'Chain has no nodes!';
                  return;
                }

                // create new API
                vnode.state.isLoading = true;
                const provider = new WsProvider(constructSubstrateUrl(nodes[0].url), false);
                try {
                  await provider.connect();
                  const api = await ApiPromise.create({ throwOnConnect: true, provider, ...vnode.state.spec });
                  const version = api.runtimeVersion;
                  const props = await api.rpc.system.properties();
                  console.log(`Fetched version: ${
                    version.specName
                  }:${
                    version.specVersion
                  } and properties ${
                    JSON.stringify(props)
                  }`);
                  vnode.state.isSpecValid = true;
                  await api.disconnect();
                } catch (e) {
                  console.error(e.message);
                  vnode.state.error = 'API initialization failed.';
                }
                vnode.state.isLoading = false;
                m.redraw();
              },
            }),

            // submit button (disabled until test succeeds)
            m(Button, {
              label: 'Submit',
              rounded: true,
              disabled: !vnode.state.isSpecValid || vnode.state.isLoading || !!vnode.state.error,
              onclick: async () => {
                vnode.state.isLoading = true;
                let response;
                try {
                  response = await $.post(`${app.serverUrl()}/editSubstrateSpec`, {
                    jwt: app.user.jwt,
                    address: app.user.activeAccount.address,
                    chain: vnode.state.chain,
                    spec: JSON.stringify(vnode.state.spec),
                  });
                } catch (err) {
                  vnode.state.error = err.message || 'Spec update failure.';
                  vnode.state.isLoading = false;
                  m.redraw();
                  return;
                }

                // update stored spec
                if (response.status === 'Success') {
                  const newChain = ChainInfo.fromJSON(response.result);
                  app.config.chains.update(newChain);

                  // reinitialize chain with new spec if editing current chain
                  if (app.chain?.id === newChain.id) {
                    const n = app.config.nodes.getByChain(newChain.id);
                    if (n.length) {
                      await selectNode(n[0]);
                      await initChain();
                    }
                  }
                }

                vnode.state.isLoading = false;
                m.redraw();
              },
            }),
          ]),
        ])
      ])
    ]);
  }
};

export default SpecSettingsPage;
