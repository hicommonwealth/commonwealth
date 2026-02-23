import {
  notifyError,
  notifySuccess,
} from 'client/scripts/controllers/app/notifications';
import MagicWebWalletController from 'client/scripts/controllers/app/webWallets/MagicWebWallet';
import {
  applySlippage,
  mergeTokens,
  mintTokens,
  parseTokenAmount,
  redeemTokens,
  swapTokens,
  type TradeParams,
} from 'client/scripts/helpers/ContractHelpers/predictionMarketTrade';
import useGetCommunityByIdQuery from 'client/scripts/state/api/communities/getCommuityById';
import { fetchNodes } from 'client/scripts/state/api/nodes';
import { useGetPredictionMarketPositionsQuery } from 'client/scripts/state/api/predictionMarket';
import useUserStore from 'client/scripts/state/ui/user';
import React, { useCallback, useState } from 'react';
import { CWText } from '../../components/component_kit/cw_text';
import { CWButton } from '../../components/component_kit/new_designs/CWButton';
import CWCircleMultiplySpinner from '../../components/component_kit/new_designs/CWCircleMultiplySpinner';
import {
  CWModalBody,
  CWModalFooter,
  CWModalHeader,
} from '../../components/component_kit/new_designs/CWModal';
import CWTab from '../../components/component_kit/new_designs/CWTabs/CWTab';
import CWTabsRow from '../../components/component_kit/new_designs/CWTabs/CWTabsRow';
import { CWTextInput } from '../../components/component_kit/new_designs/CWTextInput';
import './PredictionMarketTradeModal.scss';

const COLLATERAL_DECIMALS = 18;
const DEFAULT_SLIPPAGE_BPS = 100; // 1%

type Market = {
  id: number;
  thread_id: number;
  eth_chain_id?: number;
  vault_address?: string | null;
  router_address?: string | null;
  market_id?: string | null;
  p_token_address?: string | null;
  f_token_address?: string | null;
  collateral_address?: string;
  status: string;
  winner?: number | null;
  prompt?: string;
  [key: string]: unknown;
};

type PredictionMarketTradeModalProps = {
  market: Market;
  threadCommunityId: string;
  onClose: () => void;
  onSuccess?: () => void;
};

type TabId = 'mint' | 'swap' | 'merge' | 'redeem';

function getTradeParams(
  market: Market,
  chainRpc: string,
  userAddress: string,
  provider?: unknown,
): TradeParams {
  return {
    vault_address: market.vault_address ?? '',
    router_address: market.router_address ?? '',
    collateral_address: market.collateral_address ?? '',
    p_token_address: market.p_token_address ?? '',
    f_token_address: market.f_token_address ?? '',
    market_id: market.market_id ?? '',
    chain_rpc: chainRpc,
    eth_chain_id: market.eth_chain_id ?? 0,
    user_address: userAddress,
    provider,
  };
}

export const PredictionMarketTradeModal = ({
  market,
  threadCommunityId,
  onClose,
  onSuccess,
}: PredictionMarketTradeModalProps) => {
  const user = useUserStore();
  const activeAddress = user.activeAccount?.address ?? '';
  const [activeTab, setActiveTab] = useState<TabId>('mint');
  const [mintAmount, setMintAmount] = useState('');
  const [swapAmount, setSwapAmount] = useState('');
  const [swapBuyPass, setSwapBuyPass] = useState(true);
  const [slippageBps, setSlippageBps] = useState(DEFAULT_SLIPPAGE_BPS);
  const [mergeAmount, setMergeAmount] = useState('');
  const [redeemAmount, setRedeemAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { data: community } = useGetCommunityByIdQuery({
    id: threadCommunityId,
    includeNodeInfo: true,
    enabled: !!threadCommunityId,
  });
  const chainRpc =
    (community as { ChainNode?: { url?: string } } | undefined)?.ChainNode
      ?.url ?? '';
  const ethChainId =
    (community as { ChainNode?: { eth_chain_id?: number } } | undefined)
      ?.ChainNode?.eth_chain_id ?? 0;

  const { data: positions = [], refetch: refetchPositions } =
    useGetPredictionMarketPositionsQuery({
      prediction_market_id: market.id,
    });
  const userPosition = positions.find(
    (p: { user_address: string }) =>
      p.user_address?.toLowerCase() === activeAddress?.toLowerCase(),
  );
  const pTokenBalance = userPosition
    ? BigInt(
        (userPosition as { p_token_balance: string }).p_token_balance ?? '0',
      )
    : 0n;
  const fTokenBalance = userPosition
    ? BigInt(
        (userPosition as { f_token_balance: string }).f_token_balance ?? '0',
      )
    : 0n;
  const minBalanceForMerge =
    pTokenBalance < fTokenBalance ? pTokenBalance : fTokenBalance;

  const isResolved = market.status === 'resolved';
  const isActive = market.status === 'active';
  const swapDisabled = isResolved;
  const redeemDisabled = isActive;
  const winner = market.winner ?? 0;

  const getProvider = useCallback(async () => {
    const { userStore: store } = await import('client/scripts/state/ui/user');
    const addresses = store.getState().addresses ?? [];
    const isMagic = addresses.some(
      (addr: { address: string; walletId?: string }) =>
        addr.address?.toLowerCase() === activeAddress?.toLowerCase() &&
        addr.walletId?.toLowerCase()?.includes('magic'),
    );
    if (!isMagic) return undefined;
    await fetchNodes();
    const controller = new MagicWebWalletController();
    await controller.enable(String(ethChainId));
    return (controller as { provider?: unknown }).provider;
  }, [activeAddress, ethChainId]);

  const handleMint = async () => {
    const amountWei = parseTokenAmount(mintAmount, COLLATERAL_DECIMALS);
    if (amountWei <= 0n) {
      setErrorMessage('Enter a valid amount.');
      return;
    }
    setErrorMessage(null);
    setIsLoading(true);
    try {
      const provider = await getProvider();
      await mintTokens({
        ...getTradeParams(market, chainRpc, activeAddress, provider),
        collateral_amount_wei: amountWei,
      });
      notifySuccess('Mint successful.');
      await refetchPositions();
      onSuccess?.();
      onClose();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Mint failed.';
      setErrorMessage(msg);
      notifyError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSwap = async () => {
    const amountInWei = parseTokenAmount(swapAmount, COLLATERAL_DECIMALS);
    if (amountInWei <= 0n) {
      setErrorMessage('Enter a valid amount.');
      return;
    }
    const minAmountOutWei = applySlippage(amountInWei, slippageBps);
    setErrorMessage(null);
    setIsLoading(true);
    try {
      const provider = await getProvider();
      await swapTokens({
        ...getTradeParams(market, chainRpc, activeAddress, provider),
        buy_pass: swapBuyPass,
        amount_in_wei: amountInWei,
        min_amount_out_wei: minAmountOutWei,
      });
      notifySuccess('Swap successful.');
      await refetchPositions();
      onSuccess?.();
      onClose();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Swap failed.';
      setErrorMessage(msg);
      notifyError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMerge = async () => {
    const amountWei = parseTokenAmount(mergeAmount, COLLATERAL_DECIMALS);
    if (amountWei <= 0n || amountWei > minBalanceForMerge) {
      setErrorMessage(
        `Enter a valid amount (max ${minBalanceForMerge.toString()} wei or use balance).`,
      );
      return;
    }
    setErrorMessage(null);
    setIsLoading(true);
    try {
      const provider = await getProvider();
      await mergeTokens({
        ...getTradeParams(market, chainRpc, activeAddress, provider),
        amount_wei: amountWei,
      });
      notifySuccess('Merge successful.');
      await refetchPositions();
      onSuccess?.();
      onClose();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Merge failed.';
      setErrorMessage(msg);
      notifyError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRedeem = async () => {
    if (winner !== 1 && winner !== 2) {
      setErrorMessage('Market has no winner yet.');
      return;
    }
    const amountWei = parseTokenAmount(redeemAmount, COLLATERAL_DECIMALS);
    const maxRedeem = winner === 1 ? pTokenBalance : fTokenBalance;
    if (amountWei <= 0n || amountWei > maxRedeem) {
      setErrorMessage(`Enter a valid amount (max ${maxRedeem.toString()}).`);
      return;
    }
    setErrorMessage(null);
    setIsLoading(true);
    try {
      const provider = await getProvider();
      await redeemTokens({
        ...getTradeParams(market, chainRpc, activeAddress, provider),
        amount_wei: amountWei,
        winner: winner as 1 | 2,
      });
      notifySuccess('Redeem successful.');
      await refetchPositions();
      onSuccess?.();
      onClose();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Redeem failed.';
      setErrorMessage(msg);
      notifyError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const hasAddresses =
    market.vault_address &&
    market.router_address &&
    market.market_id &&
    market.p_token_address &&
    market.f_token_address;

  const renderTabContent = () => {
    if (activeTab === 'mint') {
      const amountWei = parseTokenAmount(mintAmount, COLLATERAL_DECIMALS);
      const costDisplay = amountWei > 0n ? mintAmount || '0' : '0';
      return (
        <div className="PredictionMarketTradeModal-tab-content">
          <CWText type="b2" className="label">
            Collateral amount
          </CWText>
          <CWTextInput
            value={mintAmount}
            onInput={(e) => setMintAmount((e.target as HTMLInputElement).value)}
            placeholder="0"
            type="text"
            containerClassName="amount-input"
          />
          <CWText type="caption" className="help">
            You will receive equal amounts of PASS and FAIL tokens.
          </CWText>
          <CWText type="b2" className="summary">
            Cost: {costDisplay} (collateral)
          </CWText>
          <CWButton
            label="Deposit and Mint"
            buttonType="primary"
            buttonHeight="sm"
            disabled={
              !mintAmount || amountWei <= 0n || isLoading || !activeAddress
            }
            onClick={() => void handleMint()}
          />
        </div>
      );
    }
    if (activeTab === 'swap') {
      const amountInWei = parseTokenAmount(swapAmount, COLLATERAL_DECIMALS);
      const minOutWei = applySlippage(amountInWei, slippageBps);
      return (
        <div className="PredictionMarketTradeModal-tab-content">
          <div className="toggle-row">
            <CWButton
              label="PASS"
              buttonType={swapBuyPass ? 'primary' : 'secondary'}
              buttonHeight="sm"
              onClick={() => setSwapBuyPass(true)}
            />
            <CWButton
              label="FAIL"
              buttonType={!swapBuyPass ? 'primary' : 'secondary'}
              buttonHeight="sm"
              onClick={() => setSwapBuyPass(false)}
            />
          </div>
          <CWText type="b2" className="label">
            {swapBuyPass ? 'Sell FAIL, buy PASS' : 'Sell PASS, buy FAIL'} —
            Amount in
          </CWText>
          <CWTextInput
            value={swapAmount}
            onInput={(e) => setSwapAmount((e.target as HTMLInputElement).value)}
            placeholder="0"
            type="text"
            containerClassName="amount-input"
          />
          <CWText type="b2" className="label">
            Slippage (%)
          </CWText>
          <CWTextInput
            value={String(slippageBps / 100)}
            onInput={(e) => {
              const v = parseFloat((e.target as HTMLInputElement).value);
              if (!Number.isNaN(v)) setSlippageBps(Math.round(v * 100));
            }}
            placeholder="1"
            type="text"
            containerClassName="amount-input"
          />
          <CWText type="caption" className="summary">
            Min. output (with slippage): {minOutWei.toString()}
          </CWText>
          <CWButton
            label="Swap"
            buttonType="primary"
            buttonHeight="sm"
            disabled={
              !swapAmount || amountInWei <= 0n || isLoading || !activeAddress
            }
            onClick={() => void handleSwap()}
          />
        </div>
      );
    }
    if (activeTab === 'merge') {
      const amountWei = parseTokenAmount(mergeAmount, COLLATERAL_DECIMALS);
      const validMerge = amountWei > 0n && amountWei <= minBalanceForMerge;
      return (
        <div className="PredictionMarketTradeModal-tab-content">
          <CWText type="b2" className="label">
            Amount to merge (max: {minBalanceForMerge.toString()} wei)
          </CWText>
          <CWTextInput
            value={mergeAmount}
            onInput={(e) =>
              setMergeAmount((e.target as HTMLInputElement).value)
            }
            placeholder="0"
            type="text"
            containerClassName="amount-input"
          />
          <CWText type="caption" className="help">
            Merge equal amounts of PASS and FAIL to get collateral back.
          </CWText>
          <CWText type="b2" className="summary">
            Collateral returned: {validMerge ? mergeAmount || '0' : '0'}
          </CWText>
          <CWButton
            label="Merge"
            buttonType="primary"
            buttonHeight="sm"
            disabled={!validMerge || isLoading || !activeAddress}
            onClick={() => void handleMerge()}
          />
        </div>
      );
    }
    // redeem
    const amountWei = parseTokenAmount(redeemAmount, COLLATERAL_DECIMALS);
    const maxRedeem = winner === 1 ? pTokenBalance : fTokenBalance;
    const validRedeem = amountWei > 0n && amountWei <= maxRedeem;
    return (
      <div className="PredictionMarketTradeModal-tab-content">
        <CWText type="b2" className="label">
          Winning token amount ({winner === 1 ? 'PASS' : 'FAIL'}) — max:{' '}
          {maxRedeem.toString()}
        </CWText>
        <CWTextInput
          value={redeemAmount}
          onInput={(e) => setRedeemAmount((e.target as HTMLInputElement).value)}
          placeholder="0"
          type="text"
          containerClassName="amount-input"
        />
        <CWText type="b2" className="summary">
          Collateral returned: {validRedeem ? redeemAmount || '0' : '0'}
        </CWText>
        <CWButton
          label="Redeem"
          buttonType="primary"
          buttonHeight="sm"
          disabled={!validRedeem || isLoading || !activeAddress}
          onClick={() => void handleRedeem()}
        />
      </div>
    );
  };

  if (!hasAddresses) {
    return (
      <div className="PredictionMarketTradeModal">
        <CWModalHeader label="Trade" onModalClose={onClose} />
        <CWModalBody>
          <CWText type="b2">
            Market not fully deployed (missing addresses).
          </CWText>
        </CWModalBody>
      </div>
    );
  }

  return (
    <div className="PredictionMarketTradeModal">
      <CWModalHeader label="Prediction market — Trade" onModalClose={onClose} />
      <CWModalBody>
        {market.prompt && (
          <CWText type="b2" className="prediction-prompt">
            {market.prompt}
          </CWText>
        )}
        <div className="balances-row">
          <CWText type="caption">
            PASS balance: {pTokenBalance.toString()}
          </CWText>
          <CWText type="caption">
            FAIL balance: {fTokenBalance.toString()}
          </CWText>
        </div>
        <CWTabsRow boxed className="tabs-row">
          <CWTab
            label="Mint"
            isSelected={activeTab === 'mint'}
            onClick={() => setActiveTab('mint')}
          />
          <CWTab
            label="Swap"
            isSelected={activeTab === 'swap'}
            onClick={() => setActiveTab('swap')}
            isDisabled={swapDisabled}
          />
          <CWTab
            label="Merge"
            isSelected={activeTab === 'merge'}
            onClick={() => setActiveTab('merge')}
          />
          <CWTab
            label="Redeem"
            isSelected={activeTab === 'redeem'}
            onClick={() => setActiveTab('redeem')}
            isDisabled={redeemDisabled}
          />
        </CWTabsRow>
        {isLoading && (
          <div className="loading-row">
            <CWCircleMultiplySpinner />
            <CWText type="b2">Processing…</CWText>
          </div>
        )}
        {errorMessage && (
          <CWText type="b2" className="error-message">
            {errorMessage}
          </CWText>
        )}
        {renderTabContent()}
      </CWModalBody>
      <CWModalFooter>
        <CWButton
          label="Close"
          buttonType="secondary"
          buttonHeight="sm"
          onClick={onClose}
        />
      </CWModalFooter>
    </div>
  );
};
