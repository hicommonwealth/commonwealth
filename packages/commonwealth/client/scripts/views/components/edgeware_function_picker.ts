import m from 'mithril';
import ClassComponent from 'class_component';
import { Input, FormLabel, FormGroup } from 'construct-ui';
import { blake2AsHex } from '@polkadot/util-crypto';

import app from 'state';
import { DropdownFormField } from 'views/components/forms';
import Substrate from 'controllers/chain/substrate/adapter';

class EdgewareFunctionPicker extends ClassComponent {
  private form: { module?: string, function?: string, args?: any[] } = { module: '', function: '', args: [] };

  private getMethod() {
    const mod = this.form.module;
    const func = this.form.function;
    const args = this.form.args;
    try {
      return (app.chain as Substrate).chain.getTxMethod(mod, func, args);
    } catch (error) {
      // eslint-disable-next-line
      return;
    }
  }

  public view(vnode) {
    this.form = this.form || {};
    this.form.module =
      this.form.module ||
      (app.chain as Substrate).chain.listApiModules()[0];
    this.form.function =
      this.form.function ||
      (app.chain as Substrate).chain.listModuleFunctions(
        this.form.module
      )[0];
    this.form.args = this.form.args || [];

    let argumentInputs;
    try {
      argumentInputs = (app.chain as Substrate).chain.generateArgumentInputs(
        this.form.module,
        this.form.function
      );
    } catch (e) {
      return m('.FunctionPicker', 'Invalid function!');
    }

    return m(
      '.FunctionPicker',
      {
        style: 'margin-bottom: 19.5px',
      },
      [
        m('div', [
          m(DropdownFormField, {
            title: 'Module',
            name: 'module',
            choices: (app.chain as Substrate).chain
              .listApiModules()
              .map((mod) => {
                return { label: mod, value: mod };
              }),
            value: this.form.module,
            defaultValue: (app.chain as Substrate).chain.listApiModules()[0],
            callback: (result) => {
              this.form.module = result;
              this.form.function = (
                app.chain as Substrate
              ).chain.listModuleFunctions(result)[0];
              this.form.args = [];
              m.redraw();
              setTimeout(() => {
                m.redraw();
              }, 0);
            },
          }),
          m(DropdownFormField, {
            title: 'Function',
            name: 'function',
            choices: (app.chain as Substrate).chain
              .listModuleFunctions(this.form.module)
              .map((func) => {
                return { label: func, value: func };
              }),
            defaultValue: (app.chain as Substrate).chain.listModuleFunctions(
              this.form.module
            )[0],
            value: this.form.function,
            callback: (result) => {
              this.form.function = result;
              this.form.args = [];
              setTimeout(() => {
                m.redraw();
              }, 0);
            },
          }),
        ]),
        m(
          'div',
          argumentInputs.map(({ name, type }, index) => {
            if (`${type}` === 'Compact<BalanceOf>') {
              return m(FormGroup, [
                m(FormLabel, `${name} (${app.chain.currency})`),
                m(Input, {
                  placeholder: `${name} (${app.chain.currency})`,
                  oninput: (e) => {
                    const result = (e.target as any).value;
                    this.form.args[index] = app.chain.chain.coins(
                      parseFloat(result),
                      true
                    );
                    m.redraw(); // TODO: why is this needed?
                  },
                }),
              ]);
            }

            if (`${type}`.match(/Vec<[A-Za-z]+>/)) {
              return m(FormGroup, [
                m(FormLabel, `${name} (${type})`),
                m(Input, {
                  placeholder: `${name} (${type})`,
                  oninput: (e) => {
                    const result = (e.target as any).value;
                    this.form.args[index] = result
                      .split(',')
                      .map((str) => str.trim());
                    m.redraw(); // TODO: why is this needed?
                  },
                }),
              ]);
            }

            return m(FormGroup, [
              m(FormLabel, `${name}`),
              m(Input, {
                placeholder: `${name} (${type})`,
                oninput: (e) => {
                  const result = (e.target as any).value;
                  this.form.args[index] = result;
                  m.redraw(); // TODO: why is this needed?
                },
              }),
            ]);
          })
        ),

        m(FormGroup, { style: 'margin-top: 20px' }, [
          m(FormLabel, 'Proposal Hash'),
          m(Input, {
            disabled: true,
            value: this.getMethod()
              ? blake2AsHex(this.getMethod().toHex())
              : '',
          }),
        ]),
      ]
    );
  },
};

export default EdgewareFunctionPicker;
