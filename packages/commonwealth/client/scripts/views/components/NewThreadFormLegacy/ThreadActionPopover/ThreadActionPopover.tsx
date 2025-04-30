import ClickAwayListener from '@mui/base/ClickAwayListener';
import React, { useCallback } from 'react';
import CWPopover, {
  PopoverTriggerProps,
  usePopover,
} from 'views/components/component_kit/new_designs/CWPopover';
import { CWIcon } from '../../component_kit/cw_icons/cw_icon';
import { IconName } from '../../component_kit/cw_icons/cw_icon_lookup';
import { CWText } from '../../component_kit/cw_text';
import MenuItem from './MenuItem';
import './ThreadActionPopover.scss';

type SharePopoverProps = {
  setSelectedActionCard?: React.Dispatch<React.SetStateAction<string[]>>;
  selectedActionCard?: string[];
} & Partial<PopoverTriggerProps>;
const items = [
  {
    icon: 'sparkle',
    title: 'Poll',
    subtext: 'Generate a poll from thread contents for members to vote',
    buttonText: 'Add',
  },
  {
    icon: 'lightning',
    title: 'Snapshot',
    subtext: 'Add existing proposal from Snapshot space.',
    buttonText: 'Add',
  },
  //currently we did not implemented fundCard feature
  // {
  //   icon: 'cardholder',
  //   title: 'Funding',
  //   subtext: 'Request funds from the community wallet.',
  //   buttonText: 'Add',
  // },
];
export const ThreadActionPopover = ({
  setSelectedActionCard,
  selectedActionCard,
}: SharePopoverProps) => {
  const popoverProps = usePopover();

  const handleClick = useCallback(
    (event: React.MouseEvent<HTMLElement, MouseEvent>) => {
      popoverProps.handleInteraction(event);
    },
    [popoverProps],
  );

  const handleToggleItem = (title) => {
    setSelectedActionCard &&
      setSelectedActionCard((prev) => {
        if (prev.includes(title)) {
          return prev.filter((item) => item !== title);
        } else {
          return [...prev, title];
        }
      });
  };

  return (
    <ClickAwayListener
      onClickAway={() => {
        popoverProps.setAnchorEl(null);
      }}
    >
      <div className="ThreadActionPopover">
        <div className="left-container" onClick={handleClick}>
          <CWIcon
            iconName="squaresFour"
            iconSize="medium"
            weight="light"
            fill="#656167"
            color="#656167"
          />
          <CWText type="caption" className="title">
            Actions
          </CWText>
        </div>

        <CWPopover
          className="ThreadActionPopoverPopover"
          body={
            <>
              {items.map((item) => (
                <MenuItem
                  key={item.title}
                  icon={item.icon as IconName}
                  title={item.title}
                  subtext={item.subtext}
                  buttonText={item.buttonText}
                  isAdded={selectedActionCard?.includes(item?.title) || false}
                  onAdd={() => handleToggleItem(item?.title)}
                />
              ))}
            </>
          }
          {...popoverProps}
        />
      </div>
    </ClickAwayListener>
  );
};
