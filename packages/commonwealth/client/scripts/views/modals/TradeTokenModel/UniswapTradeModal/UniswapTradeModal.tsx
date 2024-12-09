import { SwapWidget, Theme } from '@uniswap/widgets';
import '@uniswap/widgets/fonts.css';
import React from 'react';
import { CWText } from 'views/components/component_kit/cw_text';
import {
  CWModal,
  CWModalBody,
  CWModalFooter,
  CWModalHeader,
} from 'views/components/component_kit/new_designs/CWModal';
import TokenIcon from '../TokenIcon';
import { TradeTokenModalProps } from '../types';
import './UniswapTradeModal.scss';
import useUniswapTradeModal from './useUniswapTradeModal';

// By default the widget uses https://gateway.ipfs.io/ipns/tokens.uniswap.org for tokens
// list, but it doesn't work (DNS_PROBE_FINISHED_NXDOMAIN) for me (@malik). The original
// url resolved to https://ipfs.io/ipns/tokens.uniswap.org, i am passing this as a param to
// the uniswap widget. See: https://github.com/Uniswap/widgets/issues/580#issuecomment-2086094025
// for more context.
const UNISWAP_TOKEN_LIST = 'https://ipfs.io/ipns/tokens.uniswap.org';

// custom theme to make the widget match common's style
const theme: Theme = {
  primary: '#282729',
  secondary: '#666666',
  accent: '#514e52',
  interactive: '#3d3a3e',
  container: '#ffffff',
  dialog: '#ffffff',
  fontFamily: 'Silka',
  outline: '#e0dfe1',
  module: '#e7e7e7',
};

const UniswapTradeModal = ({
  isOpen,
  onModalClose,
  tradeConfig,
}: TradeTokenModalProps) => {
  const { uniswapProvider } = useUniswapTradeModal({ tradeConfig });

  return (
    <CWModal
      open={isOpen}
      onClose={() => onModalClose?.()}
      size="medium"
      className="UniswapTradeModal"
      content={
        <>
          <CWModalHeader
            label={
              <CWText type="h4" className="token-info">
                Swap Token - {tradeConfig.token.symbol}{' '}
                {tradeConfig.token.icon_url && (
                  <TokenIcon size="large" url={tradeConfig.token.icon_url} />
                )}
              </CWText>
            }
            onModalClose={() => onModalClose?.()}
          />
          <CWModalBody>
            <div className="Uniswap">
              <SwapWidget
                className="uniswap-widget-wrapper"
                tokenList={UNISWAP_TOKEN_LIST}
                theme={theme}
                defaultInputTokenAddress="NATIVE"
                defaultOutputTokenAddress={tradeConfig.token.token_address}
                hideConnectionUI={true}
                {...(uniswapProvider && { provider: uniswapProvider })}
              />
            </div>
          </CWModalBody>
          <CWModalFooter>
            <></>
          </CWModalFooter>
        </>
      }
    />
  );
};

export default UniswapTradeModal;
