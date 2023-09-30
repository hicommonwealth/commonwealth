import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { CWTextInput } from '../component_kit/cw_text_input';
import { QueryList } from '../component_kit/cw_query_list';
import { TemplateSelectorItem } from './TemplateSelectorItem';
import Thread from 'models/Thread';
import app from 'state';

import 'components/TemplateSelector.scss'

type TemplateSelectorProps = {
  onSelect: (template: any) => void;
  tempTemplates: Array<Pick<any, 'identifier' | 'title'>>;
  thread: Thread;
  isOpen: boolean;
  contracts: Array<any>;
};

export const TemplateSelector = ({
  onSelect,
  tempTemplates,
  contracts,
}: TemplateSelectorProps) => {
  // Add a new state for contracts
  const [loading, setLoading] = useState(false);
  const [allTemplates, setAllTemplates] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchTemplates = useCallback(async () => {
    setLoading(true);
    const fetchedTemplates = [];
    try{
      for (const contract of contracts) {
        const templates = await app.contracts.getTemplatesForContract(
          contract.id
        );
        fetchedTemplates.push(...templates);
      }
    } catch {
      setLoading(false);
    }
    setAllTemplates(fetchedTemplates);
    setLoading(false);
  }, [contracts]);

  // Fetch templates when contracts state changes
  useEffect(() => {
    if (contracts.length > 0) {
      fetchTemplates();
    }
  }, [contracts, fetchTemplates]);

  const templates = useMemo(() => {
    if (!searchTerm.length) return allTemplates;
    else {
      return allTemplates.filter(({ name }) =>
        name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
  }, [allTemplates, searchTerm]);

  const renderItem = useCallback(
    (i: number, template: any) => {
      const isSelected = !!tempTemplates.find(
        ({ identifier }) => String(template.id) === identifier
      );

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
