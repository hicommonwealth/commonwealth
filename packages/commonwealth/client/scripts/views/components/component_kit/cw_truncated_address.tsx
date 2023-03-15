import React from 'react';

import type { ResultNode } from 'mithrilInterop';
import { ClassComponent } from 'mithrilInterop';

import 'components/component_kit/cw_truncated_address.scss';

import { formatAddressShort } from '../../../helpers';
import type { ChainInfo } from 'client/scripts/models';
import { CWCommunityAvatar } from './cw_community_avatar';

type TruncatedAddressAttrs = {
  address: string;
  communityInfo?: ChainInfo;
};

export class CWTruncatedAddress extends ClassComponent<TruncatedAddressAttrs> {
  view(vnode: ResultNode<TruncatedAddressAttrs>) {
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
