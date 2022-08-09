/* @jsx m */

import m from 'mithril';
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
  defaultOffchainTemplate: string;
  description: string;
  featured_order: number;
  featuredInNewPost: boolean;
  featuredInSidebar: boolean;
  id: number;
  name: string;
  telegram: string;
};

type TopicsMenuAttrs = {
  disabled: boolean;
  featuredTopics: string[];
  otherTopics: Topic[];
  parentState: any;
  selectedTopic: Topic;
  topic: string;
};

export class TopicsMenu implements m.ClassComponent<TopicsMenuAttrs> {
  view(vnode) {
    const {
      disabled,
      featuredTopics,
      otherTopics,
      parentState,
      selectedTopic,
      topic,
    } = vnode.attrs;
    return (
      <PopoverMenu
        trigger={
          <Button
            rounded={true}
            compact={true}
            label={selectedTopic ? `Topic: ${topic}` : 'All Topics'}
            iconRight={Icons.CHEVRON_DOWN}
            size="sm"
            disabled={disabled}
          />
        }
        hasArrow={false}
        transitionDuration={0}
        closeOnContentClick={true}
        content={
          <div class="topic-items">
            <MenuItem
              active={m.route.get() === `/${app.activeChainId()}` || !topic}
              iconLeft={
                m.route.get() === `/${app.activeChainId()}` || !topic
                  ? Icons.CHECK
                  : null
              }
              label="All Topics"
              onclick={() => {
                localStorage.setItem('discussion-summary-toggle', 'false');
                parentState.summaryView = false;
                navigateToSubpage('/');
              }}
            />
            <MenuDivider />
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

                  return (
                    <MenuItem
                      key={name}
                      active={active}
                      onclick={(e) => {
                        e.preventDefault();
                        navigateToSubpage(`/discussions/${name}`);
                        parentState.summaryView = false;
                        localStorage.setItem(
                          'discussion-summary-toggle',
                          'false'
                        );
                      }}
                      label={
                        <div class="topic-item">
                          <div class="icon-and-item-name-container">
                            {active && (
                              <CWIcon iconName="check" iconSize="small" />
                            )}
                            <div class="topic-item-name" title={name}>
                              {name}
                            </div>
                          </div>
                          {app.user?.isAdminOfEntity({
                            chain: app.activeChainId(),
                          }) && (
                            <Button
                              size="xs"
                              label="Edit"
                              class="edit-button"
                              compact={true}
                              onclick={(e) => {
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
                              }}
                            />
                          )}
                        </div>
                      }
                    />
                  );
                }
              )}
          </div>
        }
      />
    );
  }
}
