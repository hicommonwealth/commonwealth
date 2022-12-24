/* @jsx jsx */


import { ClassComponent, ResultNode, render, setRoute, getRoute, getRouteParam, redraw, Component, jsx } from 'mithrilInterop';
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
  featuredTopics: Array<Topic>;
  otherTopics: Array<Topic>;
  selectedTopic: Topic;
  topic: string;
};

export class TopicsMenu extends ClassComponent<TopicsMenuAttrs> {
  view(vnode: ResultNode<TopicsMenuAttrs>) {
    const { featuredTopics, otherTopics, selectedTopic, topic } = vnode.attrs;

    return render(PopoverMenu, {
      trigger: render(Button, {
        rounded: true,
        compact: true,
        label: selectedTopic ? `Topic: ${topic}` : 'All Topics',
        iconRight: Icons.CHEVRON_DOWN,
        size: 'sm',
      }),
      hasArrow: false,
      transitionDuration: 0,
      closeOnContentClick: true,
      content: (
        <div className="topic-items">
          {render(MenuItem, {
            active: getRoute() === `/${app.activeChainId()}` || !topic,
            iconLeft:
              getRoute() === `/${app.activeChainId()}` || !topic
                ? Icons.CHECK
                : null,
            label: 'All Topics',
            onclick: () => {
              navigateToSubpage('/discussions');
            },
          })}
          {render(MenuDivider)}
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
                  getRoute() ===
                    `/${app.activeChainId()}/discussions/${encodeURI(
                      name.toString().trim()
                    )}` ||
                  (topic && topic === name);

                return render(MenuItem, {
                  key: name,
                  active,
                  onclick: (e) => {
                    e.preventDefault();
                    navigateToSubpage(`/discussions/${name}`);
                  },
                  label: (
                    <div className="topic-item">
                      <div className="icon-and-item-name-container">
                        {active && <CWIcon iconName="check" iconSize="small" />}
                        <div className="topic-item-name" title={name}>
                          {name}
                        </div>
                      </div>
                      {app.roles?.isAdminOfEntity({
                        chain: app.activeChainId(),
                      }) &&
                        render(Button, {
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
