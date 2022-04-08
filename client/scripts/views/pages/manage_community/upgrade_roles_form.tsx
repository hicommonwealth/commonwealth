/* @jsx m */

import m from 'mithril';
import $ from 'jquery';
import * as Cui from 'construct-ui';

import app from 'state';
import { RolePermission } from 'models';
import { notifySuccess, notifyError } from 'controllers/app/notifications';

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

    const names: string[] = noAdmins.map((role) => {
      const displayName = app.profiles.getProfile(
        role.Address.chain,
        role.Address.address
      ).displayName;
      const roletext = role.permission === 'moderator' ? '(moderator)' : '';
      return `${displayName}: ${role.Address.address.slice(
        0,
        6
      )}...${roletext}`;
    });

    const chainOrCommObj = { chain: app.activeChainId() };

    return (
      <div class="UpgradeRolesForm">
        <Cui.RadioGroup
          name="members/mods"
          class="members-list"
          options={names}
          value={this.user}
          onchange={(e: Event) => {
            this.user = (e.currentTarget as HTMLInputElement).value;
          }}
        />
        <div class="upgrade-buttons-wrap">
          <Cui.RadioGroup
            name="roles"
            options={['Admin', 'Moderator']}
            value={this.role}
            onchange={(e: Event) => {
              this.role = (e.currentTarget as HTMLInputElement).value;
            }}
          />
          <div class="button-container">
            <Cui.Button
              class="admin-panel-tab-button"
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
      </div>
    );
  }
}
