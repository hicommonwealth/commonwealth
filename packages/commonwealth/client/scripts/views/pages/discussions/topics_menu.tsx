import React from 'react';
import ClickAwayListener from '@mui/base/ClickAwayListener';

import 'pages/discussions/stages_menu.scss';

import app from 'state';
import { CWButton } from '../../components/component_kit/cw_button';
import {
  Popover,
  usePopover,
} from '../../components/component_kit/cw_popover/cw_popover';
import { CWDivider } from '../../components/component_kit/cw_divider';
import { CWIconButton } from '../../components/component_kit/cw_icon_button';
import { ThreadsFilterMenuItem } from './stages_menu';
import { useCommonNavigate } from 'navigation/helpers';
import type { Topic } from 'models';
import { matchRoutes } from 'react-router-dom';

type TopicsMenuProps = {
  featuredTopics: Array<Topic>;
  otherTopics: Array<Topic>;
  selectedTopic: Topic;
  topic: string;
  onEditClick: (topic: Topic) => void;
};

export const TopicsMenu = ({
  featuredTopics,
  otherTopics,
  selectedTopic,
  topic,
  onEditClick,
}: TopicsMenuProps) => {
  const navigate = useCommonNavigate();
  const popoverProps = usePopover();

  const matchesDiscussionsTopicRoute = matchRoutes(
    [{ path: '/discussions/:topic' }, { path: ':scope/discussions/:topic' }],
    location
  );

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
                isSelected={!topic}
                onClick={() => {
                  navigate('/discussions');
                }}
              />
              <CWDivider />
              {featuredTopics.concat(otherTopics).map((t) => {
                const active =
                  matchesDiscussionsTopicRoute?.[0]?.params?.topic === t.name;

                return (
                  <ThreadsFilterMenuItem
                    key={t.id}
                    label={t.name}
                    isSelected={active}
                    onClick={(e) => {
                      e.preventDefault();
                      navigate(`/discussions/${t.name}`);
                    }}
                    iconRight={
                      app.roles?.isAdminOfEntity({
                        chain: app.activeChainId(),
                      }) && (
                        <>
                          <CWIconButton
                            iconName="write"
                            iconSize="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              popoverProps.setAnchorEl(null);
                              onEditClick(t);
                            }}
                          />
                        </>
                      )
                    }
                  />
                );
              })}
            </div>
          }
          {...popoverProps}
        />
      </div>
    </ClickAwayListener>
  );
};
