/* @jsx m */

// eslint-disable-next-line @typescript-eslint/consistent-type-imports
import m from 'mithril';
import ClassComponent from 'class_component';

import 'components/component_kit/cw_truncated_address.scss';

import { formatAddressShort } from '../../../helpers';

type TruncatedAddressAttrs = {
  address: string;
  communityIcon?: string;
};

export class CWTruncatedAddress extends ClassComponent<TruncatedAddressAttrs> {
  view(vnode: m.Vnode<TruncatedAddressAttrs>) {
    const { address, communityIcon } = vnode.attrs;

    return (
      <div className="TruncatedAddress">
        {communityIcon && (
          <img className="community-icon" src={communityIcon} />
        )}
        <div className="shortened-address">{formatAddressShort(address)}</div>
      </div>
    );
  }
}
