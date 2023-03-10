/* @jsx m */

import ClassComponent from 'class_component';
import $ from 'jquery';
import m from 'mithril';

import 'pages/manage_community/upgrade_roles_form.scss';

import app from 'state';
import { formatAddressShort } from 'helpers';
import type { RoleInfo } from 'models';
import { AccessLevel } from 'models';
import { notifySuccess, notifyError } from 'controllers/app/notifications';
import { CWButton } from '../../components/component_kit/cw_button';
import { CWRadioGroup } from '../../components/component_kit/cw_radio_group';

type UpgradeRolesFormAttrs = {
  onRoleUpgrade: (oldRole: RoleInfo, newRole: RoleInfo) => void;
  roleData: RoleInfo[];
};

export class UpgradeRolesForm extends ClassComponent<UpgradeRolesFormAttrs> {
  private role: string;
  private user: string;

  view(vnode: m.Vnode<UpgradeRolesFormAttrs>) {
    const { roleData, onRoleUpgrade } = vnode.attrs;

    const nonAdmins: RoleInfo[] = roleData.filter((role) => {
      return (
        role.permission === AccessLevel.Member ||
        role.permission === AccessLevel.Moderator
      );
    });

    const nonAdminNames: string[] = nonAdmins.map((role) => {
      // @TODO: @Profiles upgrade, clean this up
      const chainId = role.chain_id ? role.chain_id : role.Address?.chain?.id;

      const displayName = app.newProfiles.getProfile(
        chainId as string,
        role.Address.address
      ).displayName;

      const roletext = role.permission === 'moderator' ? '(moderator)' : '';

      const fullText = `${displayName} - ${formatAddressShort(
        role.Address.address
      )} ${roletext}`;

      return fullText;
    });

    const chainOrCommObj = { chain: app.activeChainId() };

    return (
      <div class="UpgradeRolesForm">
        <div class="members-container">
          <CWRadioGroup
            name="members/mods"
            options={nonAdminNames.map((n) => ({ label: n, value: n }))}
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
              const indexOfName = nonAdminNames.indexOf(this.user);

              const user = nonAdmins[indexOfName];

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
