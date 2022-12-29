/* @jsx jsx */


import { ClassComponent, ResultNode, render, setRoute, getRoute, getRouteParam, redraw, Component, jsx } from 'mithrilInterop';

import 'components/component_kit/cw_address.scss';

import { CWText } from './cw_text';
import { getClasses } from './helpers';

type AddressAttrs = {
  address: string;
  darkMode?: boolean;
};

export class CWAddress extends ClassComponent<AddressAttrs> {
  view(vnode: ResultNode<AddressAttrs>) {
    const { address, darkMode } = vnode.attrs;
    return (
      <div className={getClasses<{ darkMode?: boolean }>({ darkMode }, 'Address')}>
        <CWText type="caption" className="address-text">
          {address}
        </CWText>
      </div>
    );
  }
}
