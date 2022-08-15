/* @jsx m */

import m from 'mithril';
import $ from 'jquery';

import 'pages/view_proposal/editor_permissions.scss';

import app from 'state';
import { Thread, Profile } from 'models';
import User from 'views/components/widgets/user';
import { Button, Dialog, QueryList, Classes, ListItem } from 'construct-ui';
import {
  notifyError,
  notifyInfo,
  notifySuccess,
} from 'controllers/app/notifications';
import { CWIcon } from '../../components/component_kit/cw_icons/cw_icon';

export class ProposalEditorPermissions
  implements
    m.ClassComponent<{
      thread: Thread;
      popoverMenu: boolean;
      onChangeHandler: any;
      openStateHandler: any;
    }>
{
  membersFetched: boolean;
  items: any[];
  addedEditors: any;
  removedEditors: any;
  isOpen: boolean;

  view(vnode) {
    const { thread } = vnode.attrs;
    // TODO Graham 4/4/21: We should begin developing boilerplate around fetching toggles, state
    if (!vnode.state.membersFetched) {
      vnode.state.membersFetched = true;
      const chainOrCommObj = { chain: app.activeChainId() };
      // TODO Graham 4/4/21: This needs pagination, search, or serializing.
      // The fetch time for large communities is getting unwieldy.
      $.get(`${app.serverUrl()}/bulkMembers`, chainOrCommObj)
        .then((response) => {
          if (response.status !== 'Success')
            throw new Error('Could not fetch members');
          vnode.state.items = response.result.filter((role) => {
            return role.Address.address !== app.user.activeAccount?.address;
          });
          m.redraw();
        })
        .catch((err) => {
          m.redraw();
          console.error(err);
        });
    }

    if (!vnode.state.items?.length) return;

    if (!vnode.state.addedEditors) {
      vnode.state.addedEditors = {};
    }

    if (!vnode.state.removedEditors) {
      vnode.state.removedEditors = {};
    }

    const { items } = vnode.state;

    const allCollaborators = thread.collaborators
      .concat(Object.values(vnode.state.addedEditors))
      .filter(
        (c) => !Object.keys(vnode.state.removedEditors).includes(c.address)
      );

    const existingCollaborators = m('.existing-collaborators', [
      m('span', 'Selected collaborators'),
      m(
        '.collaborator-listing',
        allCollaborators.map((c) => {
          const user: Profile = app.profiles.getProfile(c.chain, c.address);
          return m('.user-wrap', [
            m(User, { user }),
            m(CWIcon, {
              iconName: 'close',
              size: 'small',
              class: 'role-x-icon',
              onclick: async () => {
                // If already scheduled for addition, un-schedule
                if (vnode.state.addedEditors[c.address]) {
                  delete vnode.state.addedEditors[c.address];
                } else {
                  // If already an existing editor, schedule for removal
                  vnode.state.removedEditors[c.address] = c;
                }
              },
            }),
          ]);
        })
      ),
    ]);

    return m(Dialog, {
      basic: false,
      class: 'ProposalEditorPermissions',
      closeOnEscapeKey: true,
      closeOnOutsideClick: true,
      content: m('.proposal-editor-permissions-wrap', [
        m(QueryList, {
          checkmark: true,
          items,
          inputAttrs: {
            placeholder: 'Enter username or address...',
          },
          itemRender: (role: any, idx: number) => {
            const user: Profile = app.profiles.getProfile(
              role.Address.chain,
              role.Address.address
            );
            const recentlyAdded = !$.isEmptyObject(
              vnode.state.addedEditors[role.Address.address]
            );
            return m(ListItem, {
              label: [m(User, { user })],
              selected: recentlyAdded,
              key: role.Address.address,
            });
          },
          itemPredicate: (query, item, idx) => {
            const address = (item as any).Address;
            return address.name
              ? address.name.toLowerCase().includes(query.toLowerCase())
              : address.address.toLowerCase().includes(query.toLowerCase());
          },
          onSelect: (item) => {
            const addrItem = (item as any).Address;
            // If already scheduled for removal, un-schedule
            if (vnode.state.removedEditors[addrItem.address]) {
              delete vnode.state.removedEditors[addrItem.address];
            }
            // If already scheduled for addition, un-schedule
            if (vnode.state.addedEditors[addrItem.address]) {
              delete vnode.state.addedEditors[addrItem.address];
            } else if (
              thread.collaborators.filter((c) => {
                return (
                  c.address === addrItem.address && c.chain === addrItem.chain
                );
              }).length === 0
            ) {
              // If unscheduled for addition, and not an existing editor, schedule
              vnode.state.addedEditors[addrItem.address] = addrItem;
            } else {
              notifyInfo('Already an editor');
            }
          },
        }),
        allCollaborators.length > 0 && existingCollaborators,
      ]),
      hasBackdrop: true,
      isOpen: vnode.attrs.popoverMenu ? true : vnode.state.isOpen,
      inline: false,
      onClose: () => {
        if (vnode.attrs.popoverMenu) {
          vnode.attrs.openStateHandler(false);
          m.redraw();
        } else {
          vnode.state.isOpen = false;
        }
      },
      title: 'Edit collaborators',
      transitionDuration: 200,
      footer: m(`.${Classes.ALIGN_RIGHT}`, [
        m(Button, {
          label: 'Cancel',
          rounded: true,
          onclick: async () => {
            if (vnode.attrs.popoverMenu) {
              vnode.attrs.openStateHandler(false);
              m.redraw();
            } else {
              vnode.state.isOpen = false;
            }
          },
        }),
        m(Button, {
          disabled:
            $.isEmptyObject(vnode.state.addedEditors) &&
            $.isEmptyObject(vnode.state.removedEditors),
          label: 'Save changes',
          intent: 'primary',
          rounded: true,
          onclick: async () => {
            if (!$.isEmptyObject(vnode.state.addedEditors)) {
              try {
                // TODO Graham 4/4/22: Break off into proper controller methods
                const response = await $.post(`${app.serverUrl()}/addEditors`, {
                  address: app.user.activeAccount.address,
                  author_chain: app.user.activeAccount.chain.id,
                  chain: app.activeChainId(),
                  thread_id: thread.id,
                  editors: JSON.stringify(vnode.state.addedEditors),
                  jwt: app.user.jwt,
                });
                const { status, result } = response;
                if (status === 'Success') {
                  thread.collaborators = result.collaborators;
                  notifySuccess('Collaborators added');
                } else {
                  notifyError('Failed to add collaborators');
                }
              } catch (err) {
                throw new Error(
                  err.responseJSON && err.responseJSON.error
                    ? err.responseJSON.error
                    : 'Failed to add collaborators'
                );
              }
            }
            if (!$.isEmptyObject(vnode.state.removedEditors)) {
              try {
                const response = await $.post(
                  `${app.serverUrl()}/deleteEditors`,
                  {
                    address: app.user.activeAccount.address,
                    author_chain: app.user.activeAccount.chain.id,
                    chain: app.activeChainId(),
                    thread_id: thread.id,
                    editors: JSON.stringify(vnode.state.removedEditors),
                    jwt: app.user.jwt,
                  }
                );
                const { status, result } = response;
                if (status === 'Success') {
                  thread.collaborators = result.collaborators;
                  notifySuccess('Collaborators removed');
                } else {
                  throw new Error('Failed to remove collaborators');
                }
                m.redraw();
              } catch (err) {
                const errMsg =
                  err.responseJSON?.error || 'Failed to remove collaborators';
                notifyError(errMsg);
              }
            }
            if (vnode.attrs.popoverMenu) {
              vnode.attrs.openStateHandler(false);
              m.redraw();
            } else {
              vnode.state.isOpen = false;
            }
          },
        }),
      ]),
    });
  }
}
