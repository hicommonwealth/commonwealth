import useRunOnceOnCondition from 'client/scripts/hooks/useRunOnceOnCondition';
import useUserStore from 'client/scripts/state/ui/user';
import { useMemo, useState } from 'react';
import './TradeTokenForm.scss';
import { TradingMode, UseTokenTradeFormProps } from './types';

const useTokenTradeForm = ({
  tradeConfig,
  addressType,
}: UseTokenTradeFormProps) => {
  const [tradingAmount, setTradingAmount] = useState<number>(0);
  const [tradingMode, setTradingMode] = useState<TradingMode>(
    tradeConfig.mode || TradingMode.Buy,
  );
  const user = useUserStore();
  const userAddresses = useMemo(() => {
    // get all the addresses of the user that matches chain base
    const tempUserAddresses = user.addresses
      .filter((addr) =>
        addressType ? addr.community.base === addressType : true,
      )
      .map((addr) => addr.address);

    // return all the unique addresses
    return [...new Set(tempUserAddresses)];
  }, [user.addresses, addressType]);
  const [selectedAddress, setSelectedAddress] = useState<string>();

  useRunOnceOnCondition({
    callback: () => setSelectedAddress(userAddresses[0]),
    shouldRun: userAddresses.length > 0 && !selectedAddress,
  });

  const onTradingAmountChange = (
    change: React.ChangeEvent<HTMLInputElement> | number,
  ) => {
    if (typeof change == 'number') {
      setTradingAmount(change);
    } else {
      const value = change.target.value;

      if (value === '') setTradingAmount(0);
      // verify only numbers with decimal (optional) are present
      else if (/^\d+(\.\d+)?$/.test(value)) setTradingAmount(parseFloat(value));
    }
  };

  const onTradingModeChange = (mode: TradingMode) => {
    setTradingMode(mode);
  };

  const onChangeSelectedAddress = (address: string) => {
    setSelectedAddress(address);
  };

  const onCTAClick = () => {
    console.log('TODO: implement trade with data => ', {
      tradingAmount,
      tradingMode,
      tradeConfig,
    });
  };

  return {
    // Note: not exporting state setters directly, since some extra
    // functionality is done in most "onChange" handlers above
    tradingAmount,
    onTradingAmountChange,
    tradingMode,
    onTradingModeChange,
    userAddresses: {
      available: userAddresses,
      selected: selectedAddress,
      onChange: onChangeSelectedAddress,
    },
    isActionPending: false, // flag to indicate if something is ongoing - will come from token api state
    onCTAClick,
  };
};

export default useTokenTradeForm;
