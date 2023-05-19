import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { CWTextInput } from '../component_kit/cw_text_input';
import { QueryList } from '../component_kit/cw_query_list';
import { TemplateSelectorItem } from './template_action_selector_item';
import Thread from 'models/Thread';
import app from 'state';

type TemplateSelectorProps = {
  onSelect: (template: any) => void;
  tempTemplates: Array<Pick<any, 'identifier' | 'title'>>;
  thread: Thread;
  isOpen: boolean;
};

export const TemplateSelector = ({
  onSelect,
  tempTemplates,
  isOpen,
}: TemplateSelectorProps) => {
  // Add a new state for contracts
  const [contracts, setContracts] = useState<Array<any>>([]);
  const [loading, setLoading] = useState(false);
  const [fetched, setFetched] = useState(false);
  const [allTemplates, setAllTemplates] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch contracts
  const fetchContracts = async () => {
    setLoading(true);
    const contractsInStore = await app.contracts.getCommunityContracts();
    setContracts(contractsInStore);
    setLoading(false);
  };

  // Fetch templates
  const fetchTemplates = async () => {
    setLoading(true);
    const fetchedTemplates = [];
    for (const contract of contracts) {
      const templates = await app.contracts.getTemplatesForContract(
        contract.id
      );
      fetchedTemplates.push(...templates);
    }
    setAllTemplates(fetchedTemplates);
    setLoading(false);
    setFetched(true);
  };

  // Fetch contracts when the modal is open
  useEffect(() => {
    if (isOpen && !loading && !fetched) {
      fetchContracts();
    }
  }, [isOpen, loading, fetched]);

  // Fetch templates when contracts state changes
  useEffect(() => {
    if (contracts.length > 0) {
      fetchTemplates();
    }
  }, [contracts]);

  const templates = useMemo(() => {
    if (!searchTerm.length) return allTemplates;
    else {
      allTemplates
        .sort((a, b) => b.created_at - a.created_at)
        .filter(({ name }) =>
          name.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }
  }, [allTemplates, searchTerm]);

  const renderItem = useCallback(
    (i: number, template: any) => {
      const isSelected = !!tempTemplates.find(({ identifier }) => {
        console.log('template.contractAddress:', template.contractAddress);
        console.log('identifier', identifier);
        console.log('identifier.split:', identifier.split('/')[0]);
        template.contractAddress === identifier.split('/')[0];
      });

      return (
        <TemplateSelectorItem
          template={template}
          onClick={() => onSelect(template)}
          isSelected={isSelected}
        />
      );
    },
    [onSelect, tempTemplates]
  );

  if (!app.chain || !app.activeChainId()) {
    return;
  }

  const handleClearButtonClick = () => {
    setSearchTerm('');
  };

  const handleInputChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const EmptyComponent = () => (
    <div className="empty-component">No templates found</div>
  );

  return (
    <div className="TemplateSelector">
      <CWTextInput
        placeholder="Search for templates"
        iconRightonClick={handleClearButtonClick}
        value={searchTerm}
        iconRight="close"
        onInput={handleInputChange}
      />
      <QueryList
        loading={loading}
        options={templates}
        components={{ EmptyPlaceholder: EmptyComponent }}
        renderItem={renderItem}
      />
    </div>
  );
};
