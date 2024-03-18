import { notifySuccess } from 'controllers/app/notifications';
import React from 'react';
import {
  PopoverMenu,
  PopoverMenuItem,
} from 'views/components/component_kit/CWPopoverMenu';
import { CWText } from 'views/components/component_kit/cw_text';
import CWIconButton from 'views/components/component_kit/new_designs/CWIconButton';
import CWPopover, {
  usePopover,
} from 'views/components/component_kit/new_designs/CWPopover';

const popoverMenuOptions = (): Array<PopoverMenuItem> => {
  return [
    { type: 'header', label: 'Community' },
    {
      type: 'default',
      label: 'Create Thread',
      iconLeft: 'write',
      onClick: () => notifySuccess('Create thread clicked'),
    },
    {
      label: 'Create Proposal',
      iconLeft: 'write',
      onClick: () => notifySuccess('Create proposal clicked'),
    },
    {
      label: 'Create Poll',
      iconLeft: 'write',
      onClick: () => notifySuccess('Create poll clicked'),
    },
    {
      label: 'Create Snapshot',
      iconLeft: 'write',
      disabled: true,
      onClick: () => notifySuccess('Create snapshot clicked'),
    },
    { type: 'divider' },
    { type: 'header', label: 'Universal' },
    {
      label: 'Create Community',
      iconLeft: 'people',
      onClick: () => notifySuccess('Create community clicked'),
    },
    {
      label: 'Create Crowdfund',
      iconLeft: 'wallet',
      onClick: () => notifySuccess('Create crowdfund clicked'),
    },
    { type: 'divider' },
    {
      label: 'Report',
      iconLeft: 'cautionCircle',
      isSecondary: true,
      onClick: () => notifySuccess('Report clicked'),
    },
  ];
};

const PopoversShowcase = () => {
  const unstyledPopoverProps = usePopover();
  const styledPopoverProps = usePopover();

  return (
    <>
      <CWText type="h5">Regular Popover</CWText>
      <div className="flex-row">
        <CWText>Unstyled Popover</CWText>
        <CWIconButton
          buttonSize="med"
          iconName="infoEmpty"
          onMouseEnter={unstyledPopoverProps.handleInteraction}
          onMouseLeave={unstyledPopoverProps.handleInteraction}
        />
        <CWPopover
          content={
            <div>
              This is for unstyled content. You can add class to the container
              and style it for your need.
            </div>
          }
          {...unstyledPopoverProps}
        />
      </div>
      <div className="flex-row">
        <CWText>Styled by default Popover</CWText>
        <CWIconButton
          buttonSize="med"
          iconName="infoEmpty"
          onMouseEnter={styledPopoverProps.handleInteraction}
          onMouseLeave={styledPopoverProps.handleInteraction}
        />
        <CWPopover
          title="Title"
          body={<div>This is body in styled popover</div>}
          {...styledPopoverProps}
        />
      </div>

      <CWText type="h5">Menu Popover</CWText>
      <PopoverMenu
        menuItems={popoverMenuOptions()}
        renderTrigger={(onClick) => (
          <CWIconButton
            buttonSize="med"
            iconName="plusCirclePhosphor"
            onClick={onClick}
          />
        )}
      />
    </>
  );
};

export default PopoversShowcase;
