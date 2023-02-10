import React from 'react';

import type { ResultNode } from 'mithrilInterop';
import { ClassComponent } from 'mithrilInterop';

import 'components/component_kit/cw_truncated_address.scss';

import { formatAddressShort } from '../../../helpers';

type TruncatedAddressAttrs = {
  address: string;
};

export class CWTruncatedAddress extends ClassComponent<TruncatedAddressAttrs> {
  view(vnode: ResultNode<TruncatedAddressAttrs>) {
    const { address } = vnode.attrs;

    return (
      <div className="TruncatedAddress">{formatAddressShort(address)}</div>
    );
  }
}
