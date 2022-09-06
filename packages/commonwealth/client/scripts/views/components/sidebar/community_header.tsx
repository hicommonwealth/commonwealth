/* @jsx m */

import m from 'mithril';

import 'components/sidebar/community_header.scss';

import app from 'state';
import { CWCommunityAvatar } from '../component_kit/cw_community_avatar';
import { CWText } from '../component_kit/cw_text';

export class CommunityHeader implements m.ClassComponent {
  view() {
    return (
      app.chain && (
        <div class="CommunityHeader">
          <CWCommunityAvatar size="large" community={app.chain.meta} />
          <CWText type="h5" fontStyle="medium">
            {app.chain.meta.name}
          </CWText>
        </div>
      )
    );
  }
}
