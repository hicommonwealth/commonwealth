import React, { useEffect, useState } from 'react';
import { CWButton } from '../../components/component_kit/cw_button';
import { CWContentPageCard } from '../../components/component_kit/cw_content_page';
import { TemplateActionModal } from '../../modals/template_action_modal'; // Import the new modal component

import 'pages/view_thread/template_action_card.scss';
import Thread, { Link, LinkDisplay, LinkSource } from 'models/Thread';
import { Modal } from '../../components/component_kit/cw_modal';
import {
  CWDropdown,
  DropdownItemType,
} from '../../components/component_kit/cw_dropdown';
import { filterLinks } from 'helpers/threads';
import app from 'state';

type TemplateActionCardProps = {
  thread: Thread; // Pass the thread content to the modal
  onChangeHandler: (links?: Link[]) => void;
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

export const TemplateActionCard = ({
  thread,
  onChangeHandler,
}: TemplateActionCardProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDisplay, setSelectedDisplay] = useState<DropdownItemType>(
    dropdownOptions[0]
  );
  const [initialTemplates, setInitialTemplates] = useState<Link[]>([]);

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
      await app.threads.deleteLinks({
        threadId: thread.id,
        links: initialTemplates,
      });
      const newThread = await app.threads.addLinks({
        threadId: thread.id,
        links: initialTemplates.map((t) => {
          return {
            identifier: t.identifier,
            source: t.source,
            title: t.title,
            display: selected.value,
          };
        }),
      });
      const newLinks = newThread.links;
      setInitialTemplates(filterLinks(newLinks, LinkSource.Template));
      onChangeHandler(newLinks);
    }
  };

  return (
    <div>
      <CWContentPageCard
        header="Add Template"
        content={
          <div className="TemplateActionCard">
            <CWButton
              buttonType="mini-black"
              label="Add Template"
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
      <Modal
        content={
          <TemplateActionModal
            isOpen={isModalOpen}
            thread={thread}
            display={selectedDisplay.value as LinkDisplay}
            onSave={() => onChangeHandler}
            onClose={() => setIsModalOpen(false)}
          />
        }
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
};
