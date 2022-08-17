/* @jsx m */

import m from 'mithril';
import $ from 'jquery';
import smartTruncate from 'smart-truncate';

import 'pages/manage_community/upgrade_roles_form.scss';

import app from 'state';
import { RolePermission } from 'models';
import { notifySuccess, notifyError } from 'controllers/app/notifications';
import { CWButton } from '../../components/component_kit/cw_button';
import { CWRadioGroup } from '../../components/component_kit/cw_radio_group';

type UpgradeRolesFormAttrs = {
  onRoleUpgrade: (oldRole: string, newRole: string) => void;
  roleData: any[];
};

export class UpgradeRolesForm
  implements m.ClassComponent<UpgradeRolesFormAttrs>
{
  private role: string;
  private user: string;

  view(vnode) {
    const { roleData, onRoleUpgrade } = vnode.attrs;

    const noAdmins = roleData.filter((role) => {
      return (
        role.permission === RolePermission.member ||
        role.permission === RolePermission.moderator
      );
    });

    const names = noAdmins.map((role) => {
      const displayName = app.profiles.getProfile(
        role.Address.chain,
        role.Address.address
      ).displayName;

      const roletext = role.permission === 'moderator' ? '(moderator)' : '';

      const fullText = `${displayName}: ${smartTruncate(
        role.Address.address,
        6
      )} ${roletext}`;

      return { label: fullText, value: fullText };
    });

    const chainOrCommObj = { chain: app.activeChainId() };

    return (
      <div class="UpgradeRolesForm">
        <div class="members-container">
          <CWRadioGroup
            name="members/mods"
            options={names}
            toggledOption={this.user}
            onchange={(e) => {
              this.user = e.target.value;
            }}
          />
        </div>
        <div class="upgrade-buttons-container">
          <CWRadioGroup
            name="roles"
            options={[
              { label: 'Admin', value: 'Admin' },
              { label: 'Moderator', value: 'Moderator' },
            ]}
            toggledOption={this.role}
            onchange={(e) => {
              this.role = e.target.value;
            }}
          />
          <CWButton
            label="Upgrade Member"
            disabled={!this.role || !this.user}
            onclick={() => {
              const indexOfName = names.indexOf(this.user);

              const user = noAdmins[indexOfName];

              const newRole =
                this.role === 'Admin'
                  ? 'admin'
                  : this.role === 'Moderator'
                  ? 'moderator'
                  : '';

              if (!user) return;

              if (!newRole) return;

              $.post(`${app.serverUrl()}/upgradeMember`, {
                new_role: newRole,
                address: user.Address.address,
                ...chainOrCommObj,
                jwt: app.user.jwt,
              }).then((r) => {
                if (r.status === 'Success') {
                  notifySuccess('Member upgraded');
                  delete this.user;
                  delete this.role;
                  m.redraw();
                } else {
                  notifyError('Upgrade failed');
                }

                onRoleUpgrade(user, r.result);
              });
            }}
          />
        </div>
      </div>
    );
  }
}
