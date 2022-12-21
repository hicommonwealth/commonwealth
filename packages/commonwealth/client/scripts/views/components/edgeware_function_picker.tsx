/* @jsx m */

import m from 'mithril';
import ClassComponent from 'class_component';
import { blake2AsHex } from '@polkadot/util-crypto';

import app from 'state';
import Substrate from 'controllers/chain/substrate/adapter';
import { CWText } from './component_kit/cw_text';
import { CWTextInput } from './component_kit/cw_text_input';
import { CWDropdown } from './component_kit/cw_dropdown';

class EdgewareFunctionPicker extends ClassComponent {
  private form = { module: '', function: '', args: [] };

  public getMethod() {
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

  public view() {
    this.form = this.form || { module: '', function: '', args: [] };
    this.form.module =
      this.form.module || (app.chain as Substrate).chain.listApiModules()[0];
    this.form.function =
      this.form.function ||
      (app.chain as Substrate).chain.listModuleFunctions(this.form.module)[0];
    this.form.args = this.form.args || [];

    let argumentInputs;

    try {
      argumentInputs = (app.chain as Substrate).chain.generateArgumentInputs(
        this.form.module,
        this.form.function
      );
    } catch (e) {
      return <CWText>Invalid function!</CWText>;
    }

    return (
      <>
        <CWDropdown
          label="Module"
          options={(app.chain as Substrate).chain
            .listApiModules()
            .map((mod) => {
              return { label: mod, value: mod };
            })}
          onSelect={(result) => {
            this.form.module = result.value;
            this.form.function = (
              app.chain as Substrate
            ).chain.listModuleFunctions(result.value)[0];
            this.form.args = [];
            m.redraw();
            setTimeout(() => {
              m.redraw();
            }, 0);
          }}
        />
        <CWDropdown
          label="Function"
          options={(app.chain as Substrate).chain
            .listModuleFunctions(this.form.module)
            .map((func) => {
              return { label: func, value: func };
            })}
          onSelect={(result) => {
            this.form.function = result.value;
            this.form.args = [];
            setTimeout(() => {
              m.redraw();
            }, 0);
          }}
        />
        {argumentInputs.map(({ name, type }, index) => {
          if (`${type}` === 'Compact<BalanceOf>') {
            return (
              <CWTextInput
                label={`${name} (${app.chain.currency})`}
                placeholder={`${name} (${app.chain.currency})`}
                oninput={(e) => {
                  const result = (e.target as any).value;
                  this.form.args[index] = app.chain.chain.coins(
                    parseFloat(result),
                    true
                  );
                  m.redraw(); // TODO: why is this needed?
                }}
              />
            );
          } else if (`${type}`.match(/Vec<[A-Za-z]+>/)) {
            return (
              <CWTextInput
                label={`${name} (${type})`}
                placeholder={`${name} (${type})`}
                oninput={(e) => {
                  const result = (e.target as any).value;
                  this.form.args[index] = result
                    .split(',')
                    .map((str) => str.trim());
                  m.redraw(); // TODO: why is this needed?
                }}
              />
            );
          } else {
            return (
              <CWTextInput
                label={name}
                placeholder={`${name} (${type})`}
                oninput={(e) => {
                  const result = (e.target as any).value;
                  this.form.args[index] = result;
                  m.redraw(); // TODO: why is this needed?
                }}
              />
            );
          }
        })}

        <CWTextInput
          label="Proposal Hash"
          disabled
          value={this.getMethod() ? blake2AsHex(this.getMethod().toHex()) : ''}
        />
      </>
    );
  }
}

export default EdgewareFunctionPicker;
