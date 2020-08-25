import m from 'mithril';
import { Button, Input, FormLabel, FormGroup } from 'construct-ui';
import { blake2AsHex } from '@polkadot/util-crypto';

import app from 'state';
import { DropdownFormField } from 'views/components/forms';
import Substrate from 'controllers/chain/substrate/main';

const EdgewareFunctionPicker = {
  form: { module: '', function: '', args: [] },
  getMethod() {
    const mod = this.form.module;
    const func = this.form.function;
    const args = this.form.args;
    try {
      return (app.chain as Substrate).chain.getTxMethod(mod, func)(...args);
    } catch (error) {
      // eslint-disable-next-line
      return;
    }
  },
  view: (vnode) => {
    vnode.state.form = vnode.state.form || {};
    vnode.state.form.module = vnode.state.form.module || (app.chain as Substrate).chain.listApiModules()[0];
    vnode.state.form.function = vnode.state.form.function
      || (app.chain as Substrate).chain.listModuleFunctions(vnode.state.form.module)[0];
    vnode.state.form.args = vnode.state.form.args || [];

    let argumentInputs;
    try {
      argumentInputs = (app.chain as Substrate).chain.generateArgumentInputs(
        vnode.state.form.module, vnode.state.form.function
      );
    } catch (e) {
      return m('.FunctionPicker', 'Invalid function!');
    }

    return m('.FunctionPicker', [
      m('div', [
        m(DropdownFormField, {
          title: 'Module',
          name: 'module',
          choices: (app.chain as Substrate).chain.listApiModules().map((mod) => {
            return { name: mod, label: mod, value: mod };
          }),
          callback: (result) => {
            vnode.state.form.module = result;
            vnode.state.form.function = (app.chain as Substrate).chain.listModuleFunctions(result)[0];
            vnode.state.form.args = [];
            m.redraw();
          },
        }),
        m(DropdownFormField, {
          title: 'Function',
          name: 'function',
          choices: (app.chain as Substrate).chain.listModuleFunctions(vnode.state.form.module).map((func) => {
            return { name: func, label: func, value: func };
          }),
          callback: (result) => {
            vnode.state.form.function = result;
            vnode.state.form.args = [];
            setTimeout(() => { m.redraw(); }, 0);
          },
        }),
      ]),
      m('div', argumentInputs.map(({ name, type }, index) => {
        if (`${type}` === 'Compact<BalanceOf>') {
          return m(FormGroup, [
            m(FormLabel, `${name} (${app.chain.currency})`),
            m(Input, {
              placeholder: `${name} (${app.chain.currency})`,
              onchange: (e) => {
                const result = (e.target as any).value;
                vnode.state.form.args[index] = app.chain.chain.coins(parseFloat(result), true);
                m.redraw(); // TODO: why is this needed?
              }
            })
          ]);
        }

        if ((`${type}`).match(/Vec<[A-Za-z]+>/)) {
          return m(FormGroup, [
            m(FormLabel, `${name} (${type})`),
            m(Input, {
              placeholder: `${name} (${type})`,
              onchange: (e) => {
                const result = (e.target as any).value;
                vnode.state.form.args[index] = result.split(',').map((str) => str.trim());
                m.redraw(); // TODO: why is this needed?
              },
            }),
          ]);
        }

        return m(FormGroup, [
          m(FormLabel, `${name}`),
          m(Input, {
            placeholder: `${name} (${type})`,
            onchange: (e) => {
              const result = (e.target as any).value;
              vnode.state.form.args[index] = result;
              m.redraw(); // TODO: why is this needed?
            }
          }),
        ]);
      })),

      m(FormGroup, [
        m(FormLabel, 'Proposal Hash'),
        m(Input, {
          disabled: true,
          value: (EdgewareFunctionPicker.getMethod())
            ? blake2AsHex(EdgewareFunctionPicker.getMethod().method.toHex())
            : '',
        }),
      ]),
    ]);
  }
};

export default EdgewareFunctionPicker;
