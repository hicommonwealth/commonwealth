import React, { useEffect, useState } from 'react';

import 'modals/template_action_modal.scss';

import app from 'state';
import Thread, { Link, LinkSource } from '../../models/Thread';
import { filterLinks, getAddedAndDeleted } from '../../helpers/threads';
import { CWIconButton } from '../components/component_kit/cw_icon_button';
import { TemplateSelector } from '../components/template_action_selector';
import { CWButton } from '../components/component_kit/cw_button';

type TemplateFormModalProps = {
  isOpen: boolean;
  thread: Thread; // Pass the thread content to the form
  onSave: (link?: Link[]) => void;
  onClose: () => void;
};

const getInitialTemplates = (thread: Thread) =>
  filterLinks(thread.links, LinkSource.Template).map((l) => ({
    identifier: l.identifier.split('/')[0],
    title: l.title,
  }));

export const TemplateActionModal = ({
  isOpen,
  thread,
  onSave,
  onClose,
}: TemplateFormModalProps) => {
  const [tempTemplates, setTempTemplates] = useState<
    Array<Pick<any, 'identifier' | 'title'>>
  >(getInitialTemplates(thread));
  const [links, setLinks] = useState<Link[]>([]);
  const [fetched, setFetched] = useState(false);
  const [contracts, setContracts] = useState<Array<any>>([]);
  const [loading, setLoading] = useState(false);

  // Fetch contracts
  const fetchContracts = async () => {
    setLoading(true);
    const contractsInStore = await app.contracts.getCommunityContracts();
    console.log(contractsInStore);
    setContracts(contractsInStore);
    setFetched(true);
    setLoading(false);
  };

  const handleTemplateSelect = (template: any) => {
    const isSelected = !!tempTemplates.find(
      ({ identifier }) => String(template.id) === identifier
    );

    setTempTemplates(
      isSelected
        ? []
        : [
            {
              identifier: `${template.id}`,
              title: template.name,
            },
          ]
    );
  };

  const getContractAndCct = (identifier, _contracts) => {
    const contract = contracts.find((c) => {
      return c.ccts.some((cct) => String(cct.templateId) === identifier);
    });

    const cct = contract.ccts.find(
      (_cct) => String(_cct.templateId) === identifier
    );

    const newIdentifier = `${identifier}/${contract.address}${cct.cctmd.slug}`;

    return { contract, cct, newIdentifier };
  };

  const handleSaveChanges = async () => {
    try {
      const { toAdd, toDelete } = getAddedAndDeleted(
        tempTemplates,
        getInitialTemplates(thread),
        'identifier'
      );

      console.log('toAdd:', toAdd);
      console.log('toDelete:', toDelete);

      if (toAdd.length > 0) {
        const updatedLinks = toAdd.map(({ identifier, title }) => {
          // Find the contract with the specific templateId in its ccts
          const { newIdentifier } = getContractAndCct(identifier, contracts);

          return {
            source: LinkSource.Template,
            identifier: newIdentifier,
            title: title,
          };
        });

        const updatedThread = await app.threads.addLinks({
          threadId: thread.id,
          links: updatedLinks,
        });

        setLinks(updatedThread.links);
      }

      if (toDelete.length > 0) {
        const updatedThread = await app.threads.deleteLinks({
          threadId: thread.id,
          links: toDelete.map(({ identifier }) => {
            const { newIdentifier } = getContractAndCct(identifier, contracts);

            return {
              source: LinkSource.Template,
              identifier: newIdentifier,
            };
          }),
        });

        setLinks(updatedThread.links);
      }
    } catch (err) {
      console.log('Error:', err);
      throw new Error('Failed to update linked templates');
    }

    onSave(links);
  };
  // Fetch contracts when the modal is open
  useEffect(() => {
    if (isOpen && !loading && !fetched) {
      fetchContracts();
    }
  }, [isOpen, loading, fetched]);

  return (
    <div className="TemplateActionModal">
      <div className="compact-modal-title">
        <h3>Add Templates</h3>
        <CWIconButton iconName="close" onClick={() => onClose()} />
      </div>
      <div className="compact-modal-body">
        <TemplateSelector
          onSelect={handleTemplateSelect}
          tempTemplates={tempTemplates}
          contracts={contracts}
          thread={thread}
          isOpen={isOpen}
        />
        <div className="buttons-row">
          <CWButton
            label="Cancel"
            buttonType="secondary-blue"
            onClick={onClose}
          />
          <CWButton label="Save changes" onClick={handleSaveChanges} />
        </div>
      </div>
    </div>
  );
};
