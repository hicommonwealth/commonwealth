import {
  EvaluationContext,
  GeneralError,
  JsonValue,
  Logger,
  Provider,
  ProviderMetadata,
  ProviderStatus,
  ResolutionDetails,
  StandardResolutionReasons,
} from '@openfeature/web-sdk';
import { UnleashClient } from 'unleash-proxy-client';
import { IToggle } from 'unleash-proxy-client/src';

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
    await this.client.start();
    this.flags = this.client.getAllToggles();
    this.status = ProviderStatus.READY;
  }

  resolveBooleanEvaluation(
    flagKey: string,
    defaultValue: boolean,
    context: EvaluationContext,
  ): ResolutionDetails<boolean> {
    let retVal: ResolutionDetails<boolean>;
    if (
      this.status === ProviderStatus.NOT_READY ||
      this.status !== ProviderStatus.READY
    ) {
      return { value: defaultValue, reason: StandardResolutionReasons.DEFAULT };
    }

    return {
      value: this.flags.find((f) => f.name === flagKey)?.enabled,
      reason: StandardResolutionReasons.TARGETING_MATCH,
    };
  }

  resolveStringEvaluation(
    flagKey: string,
    defaultValue: string,
    context: EvaluationContext,
    logger: Logger,
  ): ResolutionDetails<string> {
    throw new GeneralError('string evaluation not supported, implement');

    return { value: defaultValue };
  }

  resolveNumberEvaluation(
    flagKey: string,
    defaultValue: number,
    context: EvaluationContext,
    logger: Logger,
  ): ResolutionDetails<number> {
    throw new GeneralError('number evaluation not supported, implement');

    return { value: defaultValue };
  }

  resolveObjectEvaluation<U extends JsonValue>(
    flagKey: string,
    defaultValue: U,
    context: EvaluationContext,
    logger: Logger,
  ): ResolutionDetails<U> {
    throw new GeneralError('object evaluation not supported, implement');

    return { value: defaultValue } as any;
  }
}
