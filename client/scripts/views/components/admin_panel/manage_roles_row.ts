import m from 'mithril';
import $ from 'jquery';
import { Icon, Icons } from 'construct-ui';
import app from 'state';
import User from '../widgets/user';


const ManageRolesRow: m.Component<{ roledata?, onRoleUpdate?: Function }> = {
  view: (vnode) => {
    if (!vnode.attrs.roledata || vnode.attrs.roledata.length === 0) return;
    const chainOrCommObj = app.community
      ? { community: app.activeCommunityId() }
      : { chain: app.activeChainId() };
    return m('.ManageRoleRow', [
          vnode.attrs.roledata?.map((role) => {
            return m('.RoleChild', [
              m(User, {
                user: [role.Address.address, role.Address.chain],
                linkify: true,
                tooltip: true,
              }),
              m(Icon, {
                name: Icons.X,
                size: 'xs',
                class: 'roleXIcon',
                onclick: async () => {
                  await $.post(`${app.serverUrl()}/upgradeMember`, {
                    ...chainOrCommObj,
                    new_role: 'member',
                    address: role.Address.address,
                    jwt: app.login.jwt,
                  }).then((res) => {
                    if (res.status !== 'Success') {
                      throw new Error(`Got unsuccessful status: ${res.status}`);
                    }
                    vnode.attrs.onRoleUpdate(role, res.result);
                  }).catch((e) => console.error('Failed To demote admin'));
                },
              }),
            ]);
          })
    ]);
  }
};

export default ManageRolesRow;
