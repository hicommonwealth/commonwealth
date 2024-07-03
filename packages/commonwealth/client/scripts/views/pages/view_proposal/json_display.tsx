import { CoinObject } from 'client/scripts/controllers/chain/cosmos/types';
import 'components/proposals/json_display.scss';
import React from 'react';
import { CWDivider } from '../../components/component_kit/cw_divider';
import { CWText } from '../../components/component_kit/cw_text';
import { CWButton } from '../../components/component_kit/new_designs/CWButton';
import { CWTooltip } from '../../components/component_kit/new_designs/CWTooltip';
import { openConfirmation } from '../../modals/confirmation_modal';
import JSONViewer from './json_viewer';

interface DataType {
  title?: string;
  details?: string;
  recipient?: string;
  amount?: CoinObject[];
}
type JSONDisplayProps = {
  data: DataType;
  title?: string;
};

export const JSONDisplay = ({ data, title }: JSONDisplayProps) => {
  const handleExport = () => {
    const dataTitle = data.title || 'Proposal';
    let markdownContent = `# ${dataTitle}\n\n`;

    // Iterate over all keys in data object
    Object.keys(data).forEach((key) => {
      const value = data[key];

      // Append key-value pair to markdown content
      markdownContent += `${key}\n\n`;
      markdownContent += `${value}\n\n`;
    });

    // Create a Blob from the markdown content
    const blob = new Blob([markdownContent], { type: 'text/markdown' });

    // Create a temporary link element
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${dataTitle}.md`;

    // Append the link to the body (required for Firefox)
    document.body.appendChild(link);

    // Trigger the download
    link.click();

    // Remove the link from the document
    document.body.removeChild(link);

    // Release the object URL
    URL.revokeObjectURL(link.href);
  };

  return (
    <div className="BlobContainer">
      {title && (
        <>
          <div className="title-and-button">
            <CWText type="b2" fontWeight="medium" className="labelText">
              {title}
            </CWText>
            <CWTooltip
              placement="top"
              content="Export as markdown file"
              renderTrigger={(handleInteraction) => (
                <div
                  onMouseEnter={handleInteraction}
                  onMouseLeave={handleInteraction}
                  className="cta-button-container"
                >
                  <CWButton
                    label="Export"
                    onClick={() => {
                      openConfirmation({
                        title: 'Warning',
                        description:
                          'A markdown file will be downloaded automatically',
                        buttons: [
                          {
                            label: 'Export markdown file',
                            buttonType: 'primary',
                            buttonHeight: 'sm',
                            onClick: handleExport,
                          },
                        ],
                      });
                    }}
                    buttonHeight="sm"
                  />
                </div>
              )}
            ></CWTooltip>
          </div>
          <CWDivider />
        </>
      )}
      {Array.isArray(data) ? (
        data.map((d, i) => <JSONViewer data={d} key={i} />)
      ) : (
        <JSONViewer data={data} />
      )}
    </div>
  );
};
