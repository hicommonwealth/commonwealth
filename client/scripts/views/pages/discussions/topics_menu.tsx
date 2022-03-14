/* @jsx m */

import m from 'mithril';
import {
  Button,
  Icons,
  Icon,
  PopoverMenu,
  MenuItem,
  MenuDivider,
} from 'construct-ui';

import 'pages/discussions/discussion_filter_bar.scss';

import app from 'state';
import { navigateToSubpage } from 'app';
import EditTopicModal from 'views/modals/edit_topic_modal';

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
            compac={true}
            label={selectedTopic ? `Topic: ${topic}` : 'All Topics'}
            iconRight={Icons.CHEVRON_DOWN}
            size="sm"
            disabled={disabled}
          />
        }
        inline={true}
        hasArrow={false}
        transitionDuration={0}
        closeOnContentClick={true}
        content={
          <div class="discussions-topic-items">
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
                        <div class="topic-menu-item">
                          {active && <Icon name={Icons.CHECK} />}
                          <div class="topic-menu-item-name">{name}</div>
                          {app.user?.isAdminOfEntity({
                            chain: app.activeChainId(),
                          }) && (
                            <Button
                              size="xs"
                              label="Edit"
                              compact={true}
                              rounded={true}
                              onclick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
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
