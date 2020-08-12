import m from 'mithril';
import { PopoverMenu, MenuItem, Icon, Icons } from 'construct-ui';

import app from 'state';
import EditTopicModal from 'views/modals/edit_topic_modal';

const TopicCaratMenu: m.Component<{ topic: string }, { topicEditorIsOpen: boolean }> = {
  view: (vnode) => {
    if (!app.isLoggedIn()) return;
    if (!app.user.isAdminOfEntity({ chain: app.activeChainId(), community: app.activeCommunityId() })) return;

    const { topic } = vnode.attrs;
    if (!topic) return;
    const topicObject = app.topics.getByIdentifier(topic);

    return [
      m(PopoverMenu, {
        transitionDuration: 0,
        closeOnOutsideClick: true,
        closeOnContentClick: true,
        menuAttrs: {},
        content: [
          m(MenuItem, {
            label: 'Edit topic',
            onclick: (e) => {
              app.modals.create({
                modal: EditTopicModal,
                data: {
                  description: topicObject.description,
                  id: topicObject.id,
                  name: topicObject.name,
                }
              });
            }
          }),
        ],
        inline: true,
        trigger: m(Icon, {
          name: Icons.CHEVRON_DOWN,
        }),
      }),
    ];
  },
};

export default TopicCaratMenu;
