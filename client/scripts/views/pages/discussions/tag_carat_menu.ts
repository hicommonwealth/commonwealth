import m from 'mithril';
import { PopoverMenu, MenuItem, Icon, Icons } from 'construct-ui';

import app from 'state';
import EditTagModal from 'views/modals/edit_tag_modal';

const TagCaratMenu: m.Component<{ tag: string }, { tagEditorIsOpen: boolean }> = {
  view: (vnode) => {
    if (!app.isLoggedIn()) return;
    if (!app.user.isAdmin({ chain: app.activeChainId(), community: app.activeCommunityId() })) return;

    const { tag } = vnode.attrs;
    if (!tag) return;
    const tagObject = app.tags.getByIdentifier(tag);

    return [
      m(PopoverMenu, {
        transitionDuration: 0,
        closeOnOutsideClick: true,
        closeOnContentClick: true,
        menuAttrs: {},
        content: [
          m(MenuItem, {
            label: 'Edit tag',
            onclick: (e) => {
              app.modals.create({
                modal: EditTagModal,
                data: {
                  description: tagObject.description,
                  id: tagObject.id,
                  name: tagObject.name,
                }
              });
            }
          }),
        ],
        trigger: m(Icon, {
          name: Icons.CHEVRON_DOWN,
        }),
      }),
    ];
  },
};

export default TagCaratMenu;
