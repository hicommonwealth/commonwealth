import {
  GeneralError,
  JsonValue,
  Provider,
  ProviderMetadata,
  ProviderStatus,
  ResolutionDetails,
  StandardResolutionReasons,
} from '@openfeature/web-sdk';
import { IToggle, UnleashClient } from 'unleash-proxy-client';

export class UnleashProvider implements Provider {
  readonly metadata: ProviderMetadata = {
    name: 'unleash-client-provider',
  };

  private client?: UnleashClient;
  status: ProviderStatus = ProviderStatus.NOT_READY;
  private flags: IToggle[];

  constructor(client: UnleashClient) {
    this.client = client;
  }

  async initialize(): Promise<void> {
    // @ts-expect-error StrictNullChecks
    await this.client.start();
    // @ts-expect-error StrictNullChecks
    this.flags = this.client.getAllToggles();
    this.status = ProviderStatus.READY;
  }

  resolveBooleanEvaluation(
    flagKey: string,
    defaultValue: boolean,
  ): ResolutionDetails<boolean> {
    if (
      this.status === ProviderStatus.NOT_READY ||
      this.status !== ProviderStatus.READY
    ) {
      return { value: defaultValue, reason: StandardResolutionReasons.DEFAULT };
    }

    return {
      // @ts-expect-error StrictNullChecks
      value: this.flags.find((f) => f.name === flagKey)?.enabled,
      reason: StandardResolutionReasons.TARGETING_MATCH,
    };
  }

  resolveStringEvaluation(
    flagKey: string,
    defaultValue: string,
  ): ResolutionDetails<string> {
    throw new GeneralError('string evaluation not supported, implement');

    return { value: defaultValue };
  }

  resolveNumberEvaluation(
    flagKey: string,
    defaultValue: number,
  ): ResolutionDetails<number> {
    throw new GeneralError('number evaluation not supported, implement');

    return { value: defaultValue };
  }

  resolveObjectEvaluation<U extends JsonValue>(
    flagKey: string,
    defaultValue: U,
  ): ResolutionDetails<U> {
    throw new GeneralError('object evaluation not supported, implement');

    return { value: defaultValue } as any;
  }
}
