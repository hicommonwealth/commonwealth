/* @jsx m */

import m from 'mithril';
import ClassComponent from 'class_component';

import 'pages/discussions/stages_menu.scss';

import app from 'state';
import { navigateToSubpage } from 'app';
import { EditTopicModal } from 'views/modals/edit_topic_modal';
import { CWButton } from '../../components/component_kit/cw_button';
import { CWPopover } from '../../components/component_kit/cw_popover/cw_popover';
import { CWDivider } from '../../components/component_kit/cw_divider';
import { ThreadsFilterMenuItem } from './stages_menu';
import { CWIconButton } from '../../components/component_kit/cw_icon_button';

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
  view(vnode: m.Vnode<TopicsMenuAttrs>) {
    const { featuredTopics, otherTopics, selectedTopic, topic } = vnode.attrs;

    return (
      <CWPopover
        trigger={
          <CWButton
            buttonType="mini-white"
            label={selectedTopic ? `Topic: ${topic}` : 'All Topics'}
            iconRight="chevronDown"
          />
        }
        content={
          <div class="threads-filter-menu-items">
            <ThreadsFilterMenuItem
              label="All Topics"
              isSelected={m.route.get() === `/${navState.activeChainId()}` || !topic}
              onclick={() => {
                navigateToSubpage('/discussions');
              }}
            />
            <CWDivider />
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
                      `/${navState.activeChainId()}/discussions/${encodeURI(
                        name.toString().trim()
                      )}` ||
                    (topic && topic === name);

                  return (
                    <ThreadsFilterMenuItem
                      label={name}
                      isSelected={active}
                      onclick={(e) => {
                        e.preventDefault();
                        navigateToSubpage(`/discussions/${name}`);
                      }}
                      iconRight={
                        app.roles?.isAdminOfEntity({
                          chain: navState.activeChainId(),
                        }) && (
                          <CWIconButton
                            iconName="write"
                            iconSize="small"
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
                        )
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
