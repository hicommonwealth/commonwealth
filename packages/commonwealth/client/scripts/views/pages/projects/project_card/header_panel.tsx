/* @jsx m */

import m, { VnodeDOM } from 'mithril';
import _ from 'lodash';
import app from 'state';

import { CWText } from 'views/components/component_kit/cw_text';
import { Project } from 'models';
import { CWIcon } from 'views/components/component_kit/cw_icons/cw_icon';
import { weiToTokens } from 'helpers';
import { CWAvatar } from '../../../components/component_kit/cw_avatar';
import { ProjectRole } from '../types';
import { getUserRoles } from '../helpers';

type HeaderPanelAttrs = { project: Project };

export class HeaderPanel implements m.ClassComponent<HeaderPanelAttrs> {
  view(vnode: VnodeDOM<HeaderPanelAttrs, this>) {
    const { project } = vnode.attrs;
    const [userRole, supportAmount] = getUserRoles(project, app.user.addresses);

    const iconUrl = app.config.chains.getById(project.chainId)?.iconUrl;
    const isSupporter = userRole && userRole !== ProjectRole.Author;

    return (
      <div
        class="HeaderPanel"
        style={`background-image: url('${project.coverImage}');`}
      >
        {userRole && (
          <div class={`user-role-banner ${userRole}`}>
            <div class="banner-left">
              <CWText type="caption" fontWeight="uppercase">
                {_.capitalize(userRole)}
              </CWText>
              {isSupporter && (
                <CWIcon iconName={userRole} iconSize="small"></CWIcon>
              )}
            </div>
            <div class="banner-right">
              {isSupporter && (
                <CWText type="caption" fontWeight="uppercase">
                  {' '}
                  {weiToTokens(supportAmount.toString(), 18)} ETH
                </CWText>
              )}
            </div>
          </div>
        )}
        {iconUrl && (
          <div
            class="chain-wrap"
            style={isSupporter ? 'top: 104px' : 'top: 8px'}
          >
            <CWAvatar iconUrl={iconUrl} size={32} />
          </div>
        )}
      </div>
    );
  }
}
