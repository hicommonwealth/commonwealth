import m from 'mithril';
import { ClassComponent, ResultNode, render, setRoute, redraw } from 'mithrilInterop';
import { Input, FormLabel, FormGroup } from 'construct-ui';
import { blake2AsHex } from '@polkadot/util-crypto';

import app from 'state';
import { DropdownFormField } from 'views/components/forms';
import Substrate from 'controllers/chain/substrate/adapter';

const EdgewareFunctionPicker = {
  form: { module: '', function: '', args: [] },
  getMethod() {
    const mod = this.form.module;
    const func = this.form.function;
    const args = this.form.args;
    try {
      return (app.chain as Substrate).chain.getTxMethod(mod, func, args);
    } catch (error) {
      // eslint-disable-next-line
      return;
    }
  },
  view: (vnode) => {
    vnode.state.form = vnode.state.form || {};
    vnode.state.form.module =
      vnode.state.form.module ||
      (app.chain as Substrate).chain.listApiModules()[0];
    vnode.state.form.function =
      vnode.state.form.function ||
      (app.chain as Substrate).chain.listModuleFunctions(
        vnode.state.form.module
      )[0];
    vnode.state.form.args = vnode.state.form.args || [];

    let argumentInputs;
    try {
      argumentInputs = (app.chain as Substrate).chain.generateArgumentInputs(
        vnode.state.form.module,
        vnode.state.form.function
      );
    } catch (e) {
      return render('.FunctionPicker', 'Invalid function!');
    }

    return render(
      '.FunctionPicker',
      {
        style: 'margin-bottom: 19.5px',
      },
      [
        render('div', [
          render(DropdownFormField, {
            title: 'Module',
            name: 'module',
            choices: (app.chain as Substrate).chain
              .listApiModules()
              .map((mod) => {
                return { label: mod, value: mod };
              }),
            value: vnode.state.form.module,
            defaultValue: (app.chain as Substrate).chain.listApiModules()[0],
            callback: (result) => {
              vnode.state.form.module = result;
              vnode.state.form.function = (
                app.chain as Substrate
              ).chain.listModuleFunctions(result)[0];
              vnode.state.form.args = [];
              redraw();
              setTimeout(() => {
                redraw();
              }, 0);
            },
          }),
          render(DropdownFormField, {
            title: 'Function',
            name: 'function',
            choices: (app.chain as Substrate).chain
              .listModuleFunctions(vnode.state.form.module)
              .map((func) => {
                return { label: func, value: func };
              }),
            defaultValue: (app.chain as Substrate).chain.listModuleFunctions(
              vnode.state.form.module
            )[0],
            value: vnode.state.form.function,
            callback: (result) => {
              vnode.state.form.function = result;
              vnode.state.form.args = [];
              setTimeout(() => {
                redraw();
              }, 0);
            },
          }),
        ]),
        render(
          'div',
          argumentInputs.map(({ name, type }, index) => {
            if (`${type}` === 'Compact<BalanceOf>') {
              return render(FormGroup, [
                render(FormLabel, `${name} (${app.chain.currency})`),
                render(Input, {
                  placeholder: `${name} (${app.chain.currency})`,
                  oninput: (e) => {
                    const result = (e.target as any).value;
                    vnode.state.form.args[index] = app.chain.chain.coins(
                      parseFloat(result),
                      true
                    );
                    redraw(); // TODO: why is this needed?
                  },
                }),
              ]);
            }

            if (`${type}`.match(/Vec<[A-Za-z]+>/)) {
              return render(FormGroup, [
                render(FormLabel, `${name} (${type})`),
                render(Input, {
                  placeholder: `${name} (${type})`,
                  oninput: (e) => {
                    const result = (e.target as any).value;
                    vnode.state.form.args[index] = result
                      .split(',')
                      .map((str) => str.trim());
                    redraw(); // TODO: why is this needed?
                  },
                }),
              ]);
            }

            return render(FormGroup, [
              render(FormLabel, `${name}`),
              render(Input, {
                placeholder: `${name} (${type})`,
                oninput: (e) => {
                  const result = (e.target as any).value;
                  vnode.state.form.args[index] = result;
                  redraw(); // TODO: why is this needed?
                },
              }),
            ]);
          })
        ),

        render(FormGroup, { style: 'margin-top: 20px' }, [
          render(FormLabel, 'Proposal Hash'),
          render(Input, {
            disabled: true,
            value: EdgewareFunctionPicker.getMethod()
              ? blake2AsHex(EdgewareFunctionPicker.getMethod().toHex())
              : '',
          }),
        ]),
      ]
    );
  },
};

export default EdgewareFunctionPicker;
