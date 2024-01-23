import {
  CacheDecorator,
  cacheDecorator as cacheDecoratorInstance,
  KeyFunction,
} from '@hicommonwealth/adapters';
import { CacheNamespaces } from '@hicommonwealth/core';
import { daemon } from '.';

export class Activity<T extends (...args: any[]) => any> {
  queryWithCache: T;
  queryWithCacheOverride: T;

  constructor(
    private label: string,
    private query: T,
    private cacheKey: KeyFunction<T>,
    private cacheDuration: number,
    private cacheNamespace: CacheNamespaces,
    private cacheDecorator: CacheDecorator = cacheDecoratorInstance,
  ) {
    this.queryWithCache = this.cacheWrapHelper(false);
    this.queryWithCacheOverride = this.cacheWrapHelper(true);
  }

  cacheWrapHelper(override: boolean) {
    return this.cacheDecorator.cacheWrap(
      override,
      this.query,
      this.cacheKey,
      this.cacheDuration,
      this.cacheNamespace,
    ) as unknown as T;
  }

  async startTask(...args: any) {
    try {
      const jobId = daemon.startTask(
        this.label,
        async () => await this.queryWithCacheOverride(...args),
        this.cacheDuration,
      );
      return jobId;
    } catch (err) {
      console.error(err);
      return;
    }
  }
}
