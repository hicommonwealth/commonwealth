import { ChainNetwork } from '@hicommonwealth/shared';
import { CoinObject } from 'client/scripts/controllers/chain/cosmos/types';
import 'components/proposals/json_display.scss';
import React from 'react';
import app from 'state';
import { CWDivider } from '../../components/component_kit/cw_divider';
import { CWText } from '../../components/component_kit/cw_text';
import { CWButton } from '../../components/component_kit/new_designs/CWButton';
import { CWTooltip } from '../../components/component_kit/new_designs/CWTooltip';
import { openConfirmation } from '../../modals/confirmation_modal';
import JSONViewer from './JSONViewer';

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
  const isKYVE = app.chain.network === ChainNetwork.Kyve;
  const handleExport = () => {
    const dataTitle = data.title || 'Proposal';
    const proposalDetails = data.details || '';

    const blob = new Blob([proposalDetails], { type: 'text/markdown' });

    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${dataTitle}.md`;

    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);

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
            {isKYVE && (
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
                            'A markdown file will be downloaded automatically.',
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
            )}
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
