import { ChainNetwork } from '@hicommonwealth/shared';
import 'components/proposals/json_display.scss';
import { CoinObject } from 'controllers/chain/cosmos/types';
import React from 'react';
import app from 'state';
import { downloadDataAsFile } from 'utils/downloadDataAsFile';
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
    const filename = `${dataTitle}.md`;
    const proposalDetails = data.details || '';

    downloadDataAsFile(proposalDetails, filename);
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
