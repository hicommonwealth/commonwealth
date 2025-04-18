import React from 'react';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWButton } from 'views/components/component_kit/new_designs/CWButton';
import {
  CWModal,
  CWModalBody,
  CWModalFooter,
  CWModalHeader,
} from 'views/components/component_kit/new_designs/CWModal';
import TokenIcon from '../TokenIcon/TokenIcon';
import { TradeTokenModalProps } from '../types';
import './JupiterTradeModal.scss';

// Jupiter Terminal docs: https://terminal.jup.ag/embedding
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { JupiterTerminal } from '@jup-ag/terminal';

const JupiterTradeModal = ({
  isOpen,
  onModalClose,
  tradeConfig,
}: TradeTokenModalProps) => {
  // Helper to get token icon and mint address for Solana
  const tokenLogo =
    (tradeConfig.token as any).icon_url || (tradeConfig.token as any).logo;
  const mintAddress =
    (tradeConfig.token as any).token_address || (tradeConfig.token as any).mint;

  // Ensure onClose matches expected signature
  const handleModalClose = (e?: any) => {
    if (onModalClose) onModalClose();
  };

  return (
    <CWModal
      open={isOpen}
      onClose={handleModalClose}
      size="medium"
      className="JupiterTradeModal"
      content={
        <>
          <CWModalHeader
            label={
              <div className="header-content">
                <CWText type="h4" className="token-info">
                  Swap Token - {tradeConfig.token.symbol}{' '}
                  {tokenLogo && <TokenIcon size="large" url={tokenLogo} />}
                </CWText>
                {/* Optionally add a Solana network indicator here if desired */}
              </div>
            }
            onModalClose={onModalClose || (() => {})}
          />
          <CWModalBody>
            <div className="Jupiter">
              <JupiterTerminal
                endpoint="https://quote-api.jup.ag/v6"
                defaultExplorer="solscan"
                strictTokenList={false}
                defaultInputMint={mintAddress}
                containerStyles={{ minHeight: 500 }}
              />
            </div>
          </CWModalBody>
          <CWModalFooter>
            <CWButton
              label="Close"
              buttonType="secondary"
              onClick={onModalClose}
            />
          </CWModalFooter>
        </>
      }
    />
  );
};

export default JupiterTradeModal;
