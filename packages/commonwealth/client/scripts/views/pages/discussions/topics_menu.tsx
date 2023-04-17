import ClickAwayListener from '@mui/base/ClickAwayListener';

import { _DEPRECATED_getRoute } from 'mithrilInterop';
import { useCommonNavigate } from 'navigation/helpers';

import 'pages/discussions/stages_menu.scss';
import React from 'react';

import app from 'state';
import type Topic from '../../../models/Topic';
import { CWButton } from '../../components/component_kit/cw_button';
import { CWDivider } from '../../components/component_kit/cw_divider';
import { CWIconButton } from '../../components/component_kit/cw_icon_button';
import { Popover, usePopover, } from '../../components/component_kit/cw_popover/cw_popover';
import { ThreadsFilterMenuItem } from './stages_menu';

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
              {featuredTopics.concat(otherTopics).map((t) => {
                const active =
                  _DEPRECATED_getRoute() ===
                    `/${app.activeChainId()}/discussions/${encodeURI(
                      t.name.toString().trim()
                    )}` ||
                  (topic && topic === t.name);

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
