/* @jsx m */

import m from 'mithril';
import ClassComponent from 'class_component';
import {
  Button,
  Icons,
  PopoverMenu,
  MenuItem,
  MenuDivider,
} from 'construct-ui';

import 'pages/discussions/topics_menu.scss';

import app from 'state';
import { navigateToSubpage } from 'app';
import { EditTopicModal } from 'views/modals/edit_topic_modal';
import { CWIcon } from '../../components/component_kit/cw_icons/cw_icon';

type Topic = {
  defaultOffchainTemplate?: string;
  description: string;
  featured_order?: number;
  featuredInNewPost?: boolean;
  featuredInSidebar?: boolean;
  id: number;
  name: string;
  telegram?: string;
};

type TopicsMenuAttrs = {
  disabled: boolean;
  featuredTopics: Topic[];
  otherTopics: Topic[];
  selectedTopic: Topic;
  topic: string;
};

export class TopicsMenu extends ClassComponent<TopicsMenuAttrs> {
  view(vnode: m.Vnode<TopicsMenuAttrs>) {
    const { disabled, featuredTopics, otherTopics, selectedTopic, topic } =
      vnode.attrs;

    return m(PopoverMenu, {
      trigger: m(Button, {
        rounded: true,
        compact: true,
        label: selectedTopic ? `Topic: ${topic}` : 'All Topics',
        iconRight: Icons.CHEVRON_DOWN,
        size: 'sm',
        disabled,
      }),
      hasArrow: false,
      transitionDuration: 0,
      closeOnContentClick: true,
      content: (
        <div class="topic-items">
          {m(MenuItem, {
            active: m.route.get() === `/${app.activeChainId()}` || !topic,
            iconLeft:
              m.route.get() === `/${app.activeChainId()}` || !topic
                ? Icons.CHECK
                : null,
            label: 'All Topics',
            onclick: () => {
              navigateToSubpage('/discussions');
            },
          })}
          {m(MenuDivider)}
          {featuredTopics
            .concat(otherTopics)
            .map(
              ({
                id,
                name,
                description,
                telegram,
                featuredInSidebar,
                featuredInNewPost,
                defaultOffchainTemplate,
              }) => {
                const active =
                  m.route.get() ===
                    `/${app.activeChainId()}/discussions/${encodeURI(
                      name.toString().trim()
                    )}` ||
                  (topic && topic === name);

                return m(MenuItem, {
                  key: name,
                  active,
                  onclick: (e) => {
                    e.preventDefault();
                    navigateToSubpage(`/discussions/${name}`);
                  },
                  label: (
                    <div class="topic-item">
                      <div class="icon-and-item-name-container">
                        {active && <CWIcon iconName="check" iconSize="small" />}
                        <div class="topic-item-name" title={name}>
                          {name}
                        </div>
                      </div>
                      {app.roles?.isAdminOfEntity({
                        chain: app.activeChainId(),
                      }) &&
                        m(Button, {
                          size: 'xs',
                          label: 'Edit',
                          class: 'edit-button',
                          compact: true,
                          onclick: (e) => {
                            e.preventDefault();
                            app.modals.create({
                              modal: EditTopicModal,
                              data: {
                                id,
                                name,
                                description,
                                telegram,
                                featuredInSidebar,
                                featuredInNewPost,
                                defaultOffchainTemplate,
                              },
                            });
                          },
                        })}
                    </div>
                  ),
                });
              }
            )}
        </div>
      ),
    });
  }
}
