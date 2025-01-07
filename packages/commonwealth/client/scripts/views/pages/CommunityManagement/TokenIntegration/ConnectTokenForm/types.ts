import { GetTokenMetadataResponse } from 'state/api/tokens/getTokenMetadata';

export enum ConnectTokenFormSteps {
  InformationalCTA = 'InformationalCTAStep',
  ConnectToken = 'ConnectTokenStep',
}

export type ConnectTokenFormProps = {
  existingToken?: GetTokenMetadataResponse;
  onTokenConnect?: () => void;
  onCancel?: () => void;
};
