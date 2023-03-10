import React from 'react';
import ClickAwayListener from '@mui/base/ClickAwayListener';

import { _DEPRECATED_getRoute } from 'mithrilInterop';

import 'pages/discussions/stages_menu.scss';

import app from 'state';
import { EditTopicModal } from 'views/modals/edit_topic_modal';
import { CWButton } from '../../components/component_kit/cw_button';
import {
  Popover,
  usePopover,
} from '../../components/component_kit/cw_popover/cw_popover';
import { CWDivider } from '../../components/component_kit/cw_divider';
import { CWIconButton } from '../../components/component_kit/cw_icon_button';
import { ThreadsFilterMenuItem } from './stages_menu';
import { Modal } from '../../components/component_kit/cw_modal';
import { useCommonNavigate } from 'navigation/helpers';

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

type TopicsMenuProps = {
  featuredTopics: Array<Topic>;
  otherTopics: Array<Topic>;
  selectedTopic: Topic;
  topic: string;
};

export const TopicsMenu = (props: TopicsMenuProps) => {
  const { featuredTopics, otherTopics, selectedTopic, topic } = props;

  const navigate = useCommonNavigate();
  const popoverProps = usePopover();
  const [isModalOpen, setIsModalOpen] = React.useState<boolean>(false);

  return (
    <ClickAwayListener onClickAway={() => popoverProps.setAnchorEl(null)}>
      {/* needs to be div instead of fragment so listener can work */}
      <div>
        <CWButton
          buttonType="mini-white"
          label={selectedTopic ? `Topic: ${topic}` : 'All Topics'}
          iconRight="chevronDown"
          onClick={popoverProps.handleInteraction}
        />
        <Popover
          content={
            <div className="threads-filter-menu-items">
              <ThreadsFilterMenuItem
                label="All Topics"
                isSelected={
                  _DEPRECATED_getRoute() === `/${app.activeChainId()}` || !topic
                }
                onClick={() => {
                  navigate('/discussions');
                }}
              />
              <CWDivider />
              {featuredTopics
                .concat(otherTopics)
                .map(
                  (
                    {
                      id,
                      name,
                      description,
                      featuredInSidebar,
                      featuredInNewPost,
                      defaultOffchainTemplate,
                    },
                    i
                  ) => {
                    const active =
                      _DEPRECATED_getRoute() ===
                        `/${app.activeChainId()}/discussions/${encodeURI(
                          name.toString().trim()
                        )}` ||
                      (topic && topic === name);

                    return (
                      <ThreadsFilterMenuItem
                        key={`${i}`}
                        label={name}
                        isSelected={active}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          navigate(`/discussions/${name}`);
                        }}
                        iconRight={
                          app.roles?.isAdminOfEntity({
                            chain: app.activeChainId(),
                          }) && (
                            <React.Fragment>
                              <CWIconButton
                                iconName="write"
                                iconSize="small"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  setIsModalOpen(true);
                                }}
                              />
                              <Modal
                                content={
                                  <EditTopicModal
                                    id={id}
                                    name={name}
                                    description={description}
                                    featuredInSidebar={featuredInSidebar}
                                    featuredInNewPost={featuredInNewPost}
                                    defaultOffchainTemplate={
                                      defaultOffchainTemplate
                                    }
                                    onModalClose={() => setIsModalOpen(false)}
                                  />
                                }
                                onClose={() => setIsModalOpen(false)}
                                open={isModalOpen}
                              />
                            </React.Fragment>
                          )
                        }
                      />
                    );
                  }
                )}
            </div>
          }
          {...popoverProps}
        />
      </div>
    </ClickAwayListener>
  );
};
