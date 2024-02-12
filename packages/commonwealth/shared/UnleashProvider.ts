import {
  EvaluationContext,
  GeneralError,
  JsonValue,
  Provider,
  ProviderMetadata,
  ProviderNotReadyError,
  ProviderStatus,
  ResolutionDetails,
} from '@openfeature/web-sdk';
import { UnleashClient } from 'unleash-proxy-client';

export class UnleashProvider implements Provider {
  readonly metadata: ProviderMetadata = {
    name: 'unleash-client-provider',
  };

  private _client?: UnleashClient;
  private _unleashProviderConfig?: any;
  private _status: ProviderStatus = ProviderStatus.NOT_READY;

  constructor(unleashProviderConfig: any) {
    this.unleashProviderConfig = unleashProviderConfig;
  }

  async initialize(): Promise<void> {
    this.client = new UnleashClient(this.unleashProviderConfig);
    this.client.start();
    this.status = ProviderStatus.READY;
  }

  set status(status: ProviderStatus) {
    this._status = status;
  }

  get status() {
    return this._status;
  }

  set unleashProviderConfig(unleashProviderConfig: IConfig) {
    this._unleashProviderConfig = unleashProviderConfig;
  }

  get unleashProviderConfig() {
    return this._unleashProviderConfig;
  }

  set client(client: UnleashClient) {
    this._client = client;
  }

  get client(): UnleashClient {
    if (!this._client) {
      throw new ProviderNotReadyError('Provider is not initialized');
    }
    return this._client;
  }

  async resolveBooleanEvaluation(
    flagKey: string,
    defaultValue: boolean,
    context: EvaluationContext,
  ): Promise<ResolutionDetails<boolean>> {
    if (
      this.status === ProviderStatus.NOT_READY &&
      this.status !== ProviderStatus.READY
    ) {
      throw new ProviderNotReadyError('Provider is not initialized');
    }

    return await this.client.isEnabled(flagKey);
  }

  async resolveStringEvaluation(
    flagKey: string,
    defaultValue: string,
    context: EvaluationContext,
  ): Promise<ResolutionDetails<string>> {
    throw new GeneralError('string evaluation not supported, implement');

    return null;
  }

  async resolveNumberEvaluation(
    flagKey: string,
    defaultValue: number,
    context: EvaluationContext,
  ): Promise<ResolutionDetails<number>> {
    throw new GeneralError('number evaluation not supported, implement');

    return null;
  }

  async resolveObjectEvaluation<U extends JsonValue>(
    flagKey: string,
    defaultValue: U,
    context: EvaluationContext,
  ): Promise<ResolutionDetails<U>> {
    throw new GeneralError('object evaluation not supported, implement');

    return null;
  }
}
