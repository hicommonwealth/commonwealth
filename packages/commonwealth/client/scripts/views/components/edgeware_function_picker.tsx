/* @jsx jsx */
import React from 'react';

import {
  ClassComponent,
  ResultNode,
  render,
  setRoute,
  getRoute,
  getRouteParam,
  redraw,
  Component,
  jsx,
} from 'mithrilInterop';

import { blake2AsHex } from '@polkadot/util-crypto';
import ClassComponent from 'class_component';
import type Substrate from 'controllers/chain/substrate/adapter';
import m from 'mithril';

import app from 'state';
import { CWDropdown } from './component_kit/cw_dropdown';
import { CWText } from './component_kit/cw_text';
import { CWTextInput } from './component_kit/cw_text_input';

type EdgewareFunctionPickerProps = {
  module: string;
  function: string;
  args: any[];
};

class EdgewareFunctionPicker extends ClassComponent<EdgewareFunctionPickerProps> {
  public static getMethod(attrs: EdgewareFunctionPickerProps) {
    const mod = attrs.module;
    const func = attrs.function;
    const args = attrs.args;
    try {
      return (app.chain as Substrate).chain.getTxMethod(mod, func, args);
    } catch (error) {
      // eslint-disable-next-line
      return;
    }
  }

  public view(vnode: ResultNode<EdgewareFunctionPickerProps>) {
    vnode.attrs = vnode.attrs || { module: '', function: '', args: [] };
    vnode.attrs.module =
      vnode.attrs.module || (app.chain as Substrate).chain.listApiModules()[0];
    vnode.attrs.function =
      vnode.attrs.function ||
      (app.chain as Substrate).chain.listModuleFunctions(vnode.attrs.module)[0];
    vnode.attrs.args = vnode.attrs.args || [];

    let argumentInputs;

    try {
      argumentInputs = (app.chain as Substrate).chain.generateArgumentInputs(
        vnode.attrs.module,
        vnode.attrs.function
      );
    } catch (e) {
      return <CWText>Invalid function!</CWText>;
    }

    return (
      <React.Fragment>
        <CWDropdown
          label="Module"
          options={(app.chain as Substrate).chain
            .listApiModules()
            .map((mod) => {
              return { label: mod, value: mod };
            })}
          onSelect={(result) => {
            vnode.attrs.module = result.value;
            vnode.attrs.function = (
              app.chain as Substrate
            ).chain.listModuleFunctions(result.value)[0];
            vnode.attrs.args = [];
            redraw();
            setTimeout(() => {
              redraw();
            }, 0);
          }}
        />
        <CWDropdown
          label="Function"
          options={(app.chain as Substrate).chain
            .listModuleFunctions(vnode.attrs.module)
            .map((func) => {
              return { label: func, value: func };
            })}
          onSelect={(result) => {
            vnode.attrs.function = result.value;
            vnode.attrs.args = [];
            setTimeout(() => {
              redraw();
            }, 0);
          }}
        />
        {argumentInputs.map(({ name, type }, index) => {
          if (`${type}` === 'Compact<BalanceOf>') {
            return (
              <CWTextInput
                label={`${name} (${app.chain.currency})`}
                placeholder={`${name} (${app.chain.currency})`}
                onInput={(e) => {
                  const result = (e.target as any).value;
                  vnode.attrs.args[index] = app.chain.chain.coins(
                    parseFloat(result),
                    true
                  );
                  redraw(); // TODO: why is this needed?
                }}
              />
            );
          } else if (`${type}`.match(/Vec<[A-Za-z]+>/)) {
            return (
              <CWTextInput
                label={`${name} (${type})`}
                placeholder={`${name} (${type})`}
                onInput={(e) => {
                  const result = (e.target as any).value;
                  vnode.attrs.args[index] = result
                    .split(',')
                    .map((str) => str.trim());
                  redraw(); // TODO: why is this needed?
                }}
              />
            );
          } else {
            return (
              <CWTextInput
                label={name}
                placeholder={`${name} (${type})`}
                onInput={(e) => {
                  const result = (e.target as any).value;
                  vnode.attrs.args[index] = result;
                  redraw(); // TODO: why is this needed?
                }}
              />
            );
          }
        })}

        <CWTextInput
          label="Proposal Hash"
          disabled
          value={
            EdgewareFunctionPicker.getMethod(vnode.attrs)
              ? blake2AsHex(
                  EdgewareFunctionPicker.getMethod(vnode.attrs).toHex()
                )
              : ''
          }
        />
      </React.Fragment>
    );
  }
}

export default EdgewareFunctionPicker;
