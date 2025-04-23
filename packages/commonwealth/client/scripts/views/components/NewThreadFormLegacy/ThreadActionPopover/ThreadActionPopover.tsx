import ClickAwayListener from '@mui/base/ClickAwayListener';
import React, { useCallback } from 'react';
import CWPopover, {
  PopoverTriggerProps,
  usePopover,
} from 'views/components/component_kit/new_designs/CWPopover';
import { CWIcon } from '../../component_kit/cw_icons/cw_icon';
import { CWText } from '../../component_kit/cw_text';
import MenuItem from './MenuItem';
import './ThreadActionPopover.scss';

type SharePopoverProps = {
  setSelectedActionCard?: React.Dispatch<React.SetStateAction<string[]>>;
  selectedActionCard?: string[];
} & Partial<PopoverTriggerProps>;

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
  const items = [
    {
      icon: 'sparkle',
      title: 'Poll',
      subtext: 'Generate a poll from thread contents for memebers to vote',
      buttonText: 'Add',
    },
    {
      icon: 'lightning',
      title: 'Snapshot',
      subtext: 'Add existing proposal from Snapshot space.',
      buttonText: 'Add',
    },
    {
      icon: 'cardholder',
      title: 'Funding',
      subtext: 'Request funds from the community wallet.',
      buttonText: 'Add',
    },
  ];

  const handleAddItem = (title: string) => {
    setSelectedActionCard && setSelectedActionCard((prev) => [...prev, title]);
  };

  return (
    <ClickAwayListener
      onClickAway={async () => {
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
          <CWText fontWeight="regular" className="action">
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
                  icon={item.icon}
                  title={item.title}
                  subtext={item.subtext}
                  buttonText={item.buttonText}
                  isAdded={selectedActionCard?.includes(item?.title)}
                  onAdd={() => handleAddItem(item?.title)}
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
