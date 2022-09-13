/* @jsx m */

import m from 'mithril';

import 'components/sidebar/community_header.scss';

import { ChainInfo } from 'models';
import { CWCommunityAvatar } from '../component_kit/cw_community_avatar';
import { CWText } from '../component_kit/cw_text';

export class CommunityHeader implements m.ClassComponent<{ meta: ChainInfo }> {
  view(vnode) {
    const { meta } = vnode.attrs;

    return (
      <div class="CommunityHeader">
        <div class="inner-container">
          <CWCommunityAvatar size="large" community={meta} />
          <CWText type="h5" fontStyle="medium">
            {meta.name}
          </CWText>
        </div>
      </div>
    );
  }
}
