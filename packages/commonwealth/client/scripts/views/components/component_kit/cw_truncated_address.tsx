/* @jsx m */

// eslint-disable-next-line @typescript-eslint/consistent-type-imports
import m from 'mithril';
import ClassComponent from 'class_component';

import 'components/component_kit/cw_truncated_address.scss';

import { formatAddressShort } from '../../../helpers';
import { CWCommunityAvatar } from './cw_community_avatar';
import { ChainInfo } from 'client/scripts/models';

type TruncatedAddressAttrs = {
  address: string;
  communityInfo?: ChainInfo;
};

export class CWTruncatedAddress extends ClassComponent<TruncatedAddressAttrs> {
  view(vnode: m.Vnode<TruncatedAddressAttrs>) {
    const { address, communityInfo } = vnode.attrs;

    return (
      <div
        className={
          communityInfo ? 'TruncatedAddress with-community' : 'TruncatedAddress'
        }
      >
        {communityInfo && (
          <CWCommunityAvatar community={communityInfo} size="small" />
        )}
        {formatAddressShort(address)}
      </div>
    );
  }
}
