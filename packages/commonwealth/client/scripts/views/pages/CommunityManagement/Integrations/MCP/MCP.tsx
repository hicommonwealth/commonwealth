import { DOCS_SUBDOMAIN } from '@hicommonwealth/shared';
import { useCommonNavigate } from 'navigation/helpers';
import React from 'react';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWButton } from 'views/components/component_kit/new_designs/CWButton';
import './MCP.scss';

const MCP = () => {
  const navigate = useCommonNavigate();
  return (
    <section className="MCP">
      <div className="header">
        <CWText type="h4">MCP Integrations</CWText>
        <CWText type="b1">
          <p>
            Enable or disable Model Context Protocol servers to control the AI tools available in your community.{' '}
            <a
              target="_blank"
              rel="noopener noreferrer"
              href={`https://${DOCS_SUBDOMAIN}/commonwealth/ai-tools`}
            >
              Learn more
            </a>
            .
          </p>
        </CWText>
      </div>
      <CWButton
        buttonType="secondary"
        label="Manage MCP Integrations"
        onClick={() => navigate('/manage/integrations/mcp')}
      />
    </section>
  );
};

export default MCP;
