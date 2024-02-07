import React, { useEffect, useState } from 'react';
import { CWButton } from '../../components/component_kit/cw_button';
import { CWContentPageCard } from '../../components/component_kit/CWContentPageCard';
import { TemplateActionModal } from '../../modals/TemplateActionModal'; // Import the new modal component

import 'pages/view_thread/TemplateActionCard.scss';
import Thread, { Link, LinkDisplay, LinkSource } from 'models/Thread';
import { CWModal } from 'views/components/component_kit/new_designs/CWModal';
import {
  CWDropdown,
  DropdownItemType,
} from '../../components/component_kit/cw_dropdown';
import { filterLinks } from 'helpers/threads';
import app from 'state';
import useAddThreadLinksMutation from 'state/api/threads/addThreadLinks';
import { useDeleteThreadLinksMutation } from 'state/api/threads';

type TemplateActionCardProps = {
  thread: Thread; // Pass the thread content to the modal
};
const dropdownOptions: DropdownItemType[] = [
  {
    label: 'sidebar',
    value: LinkDisplay.sidebar,
  },
  {
    label: 'in-line',
    value: LinkDisplay.inline,
  },
  {
    label: 'inline and sidebar',
    value: LinkDisplay.both,
  },
];

export const TemplateActionCard = ({ thread }: TemplateActionCardProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDisplay, setSelectedDisplay] = useState<DropdownItemType>(
    dropdownOptions[0]
  );
  const [initialTemplates, setInitialTemplates] = useState<Link[]>([]);
  const { mutateAsync: addThreadLinks } = useAddThreadLinksMutation({
    chainId: app.activeChainId(),
    threadId: thread.id,
  });

  const { mutateAsync: deleteThreadLinks } = useDeleteThreadLinksMutation({
    chainId: app.activeChainId(),
    threadId: thread.id,
  });
  useEffect(() => {
    const initLinks = filterLinks(thread.links, LinkSource.Template);
    setInitialTemplates(initLinks);
    if (initLinks.length > 0) {
      setSelectedDisplay(
        dropdownOptions.find((o) => o.value === initLinks[0].display)
      );
    }
  }, []);

  const onDisplayChange = async (selected: DropdownItemType) => {
    if (selected.value !== initialTemplates[0].display) {
      await deleteThreadLinks({
        chainId: app.activeChainId(),
        threadId: thread.id,
        links: initialTemplates,
      });
      const newThread = await addThreadLinks({
        chainId: app.activeChainId(),
        threadId: thread.id,
        links: initialTemplates.map((t) => {
          return {
            identifier: t.identifier,
            source: t.source,
            title: t.title,
            display: selected.value,
          } as Link;
        }),
      });
      const newLinks = newThread.links;
      setInitialTemplates(filterLinks(newLinks, LinkSource.Template));
    }
  };

  return (
    <div>
      <CWContentPageCard
        header="Add contract action"
        content={
          <div className="TemplateActionCard">
            <CWButton
              buttonType="mini-black"
              label="Add contract action"
              onClick={() => setIsModalOpen(true)}
            />
            {initialTemplates.length > 0 && (
              <CWDropdown
                label="Display Options"
                options={dropdownOptions}
                initialValue={selectedDisplay}
                onSelect={(o) => onDisplayChange(o)}
              />
            )}
          </div>
        }
      />
      <CWModal
        size="small"
        content={
          <TemplateActionModal
            isOpen={isModalOpen}
            thread={thread}
            display={selectedDisplay.value as LinkDisplay}
            onSave={() => setIsModalOpen(false)}
            onClose={() => setIsModalOpen(false)}
          />
        }
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
};
