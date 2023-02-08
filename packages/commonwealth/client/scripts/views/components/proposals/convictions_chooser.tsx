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

import {
  convictions,
  convictionToLocktime,
  convictionToWeight,
} from 'controllers/chain/substrate/democracy_referendum';
import m from 'mithril';
import { CWDropdown } from '../component_kit/cw_dropdown';

type ConvictionsChooserAttrs = { callback: (number) => void };

export class ConvictionsChooser extends ClassComponent<ConvictionsChooserAttrs> {
  oncreate(vnode: ResultNode<ConvictionsChooserAttrs>) {
    vnode.attrs.callback(convictions()[0].toString());
  }

  view(vnode: ResultNode<ConvictionsChooserAttrs>) {
    const options = convictions().map((c) => ({
      value: c.toString(),
      label: `${convictionToWeight(
        c
      )}x weight (locked for ${convictionToLocktime(c)}x enactment period)`,
    }));

    return (
      <CWDropdown
        label="Convictions"
        options={options}
        onSelect={(o) => {
          vnode.attrs.callback(parseInt((o as any).value, 10));
        }}
      />
    );
  }
}
