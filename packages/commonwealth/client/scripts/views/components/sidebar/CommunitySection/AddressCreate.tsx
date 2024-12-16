import clsx from 'clsx';
import React, { useState } from 'react';

import useInviteLinkModal from 'state/ui/modals/inviteLinkModal';
import { PopoverMenu } from 'views/components/component_kit/CWPopoverMenu';
import { CWIcon } from 'views/components/component_kit/cw_icons/cw_icon';
import useUserMenuItems from '../../SublayoutHeader/useUserMenuItems';
import { DefaultMenuItem, HeaderMenuItem } from '../../component_kit/types';

import './AddressCreate.scss';

interface AddressCreateProps {
  onAuthModalOpen: () => void;
}

const AddressCreate = ({ onAuthModalOpen }: AddressCreateProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const { setIsInviteLinkModalOpen } = useInviteLinkModal();

  const { userMenuItems } = useUserMenuItems({
    onAuthModalOpen,
    isMenuOpen: isOpen,
    onReferralItemClick: () => setIsInviteLinkModalOpen(true),
  });

  const filteredMenuItem = userMenuItems.filter(
    (item): item is DefaultMenuItem | HeaderMenuItem =>
      (item.type === 'default' || item.type === 'header') &&
      item.label === 'Connect a new address',
  );

  return (
    <PopoverMenu
      className="AddressCreate"
      placement="right-start"
      modifiers={[{ name: 'offset', options: { offset: [0, 3] } }]}
      menuItems={filteredMenuItem}
      onOpenChange={(open) => setIsOpen(open)}
      renderTrigger={(onClick) => (
        <button
          className={clsx('AddressDropdownTriggerButton', { isOpen })}
          onClick={onClick}
        >
          <CWIcon
            iconName={'plus'}
            iconSize="small"
            className="caret-icon"
            weight="bold"
          />
        </button>
      )}
    />
  );
};

export default AddressCreate;
