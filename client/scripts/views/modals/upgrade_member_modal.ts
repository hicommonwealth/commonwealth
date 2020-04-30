import 'modals/upgrade_member_modal.scss';

import m from 'mithril';
import $ from 'jquery';
import mixpanel from 'mixpanel-browser';

import app from 'state';

import { RolePermission } from 'models';
import { CompactModalExitButton } from 'views/modal';
import { sortAdminsAndModsFirst } from '../pages/discussions/roles';

const UpgradeMemberModal = {
  oncreate: (vnode) => {
    mixpanel.track('New Member-to-Admin Upgrade', {
      'Step No': 1,
      Step: 'Modal Opened',
    });
    if (!app.activeCommunityId()) return; // TODO: Check necessary?
    vnode.state.loadingStarted = true;
    $.get(`${app.serverUrl()}/bulkMembers`, {
      community: app.activeCommunityId(),
    }).then((response) => {
      if (response.status !== 'Success') {
        throw new Error(`got unsuccessful status: ${response.status}`);
      }
      vnode.state.roleData = response.result;
      if (vnode.state.roleData.findIndex((role) => {
        return (role.Address.address === app.vm.activeAccount.address
                && role.permission === RolePermission.moderator);
      }) !== -1) {
        vnode.state.isMod = true;
      }
      vnode.state.loadingFinished = true;
      m.redraw();
    }, (err) => {
      vnode.state.roleData = [];
      vnode.state.loadingFinished = true;
      m.redraw();
    });
  },
  view: (vnode) => {
    const upgradeMemberButton = () => {
      return m('button.upgrade-member-button', {
        type: 'submit',
        onclick: (e) => {
          e.preventDefault();
          const newRole = $(vnode.dom).find('[name="role"]:checked').val();
          const member = $(vnode.dom).find('[name="member_select"]:checked').val();
          if (newRole === null) return;
          if (member === null) return;

          $.post(`${app.serverUrl()}/upgradeMember`, {
            new_role: newRole,
            address: member,
            community: app.activeCommunityId(),
            jwt: app.login.jwt,
          }).then((result) => {
            vnode.state.disabled = false;
            if (result.status === 'Success') {
              vnode.state.success = true;
              vnode.state.failure = false;
            } else {
              vnode.state.failure = true;
              vnode.state.success = false;
              vnode.state.error = result.message;
            }
            m.redraw();
            mixpanel.track('Upgraded Member', {
              'Step No': 2,
              Step: 'Upgraded Member',
            });
          }, (err) => {
            vnode.state.failure = true;
            vnode.state.disabled = false;
            if (err.responseJSON) vnode.state.error = err.responseJSON.error;
            m.redraw();
          });
        },
      }, 'Upgrade Member');
    };

    return m('.UpgradeMemberModal', [
      m('.compact-modal-title', [
        m('h2', 'Create an Admin or Mod'),
        m(CompactModalExitButton),
      ]),
      m('form.compact-modal-body', [
        m('h3', 'Role Type: '),
        m('.role-selection', [
          !vnode.state.isMod
          && m('input[type="radio"]', {
            name: 'role',
            value: 'admin',
            id: 'adminRadio',
          }),
          !vnode.state.isMod
          && m('label', {
            for: 'adminRadio',
          }, 'Admin'),
          m('input[type="radio"]', {
            name: 'role',
            value: 'moderator',
            id: 'modRadio',
          }),
          m('label', {
            for: 'modRadio',
          }, 'Moderator'),
        ]),
        m('h3', 'Member to upgrade:'),
        (vnode.state.roleData)
          ? vnode.state.roleData.sort(sortAdminsAndModsFirst).filter(
            (role) => {
              return role.permission === RolePermission.member
                || (!vnode.state.isMod && role.permission === RolePermission.moderator);
            }
          ).map((role) => {
            const displayName = app.profiles.getProfile(role.Address.chain, role.Address.address).displayName;
            return m('.form-field', [
              m('input[type="radio"]', {
                name: 'member_select',
                value: `${role.Address.address}`,
                id: `${role.Address.address}`,
              }),
              m('label', {
                for: `${role.Address.address}`
              },
              `${displayName}: ${role.Address.address.slice(0, 6)}...`),
            ]);
          })
          : m('.loading-members', 'no members to upgrade'),
        m('.divider'),
        upgradeMemberButton(),
        vnode.state.success && m('.success-message', [
          'Success! Member was successfully upgraded',
        ]),
        vnode.state.failure && m('.error-message', [
          vnode.state.error || 'An error occurred',
        ]),
      ]),
    ]);
  },
};

export default UpgradeMemberModal;
