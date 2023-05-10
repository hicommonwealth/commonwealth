import { RedisNamespaces } from '../types';
import { cacheDecorator } from 'common-common/src/cacheDecorator';
import { daemon } from '.';

export class Activity   {
  label: string;
  query: any;
  cacheKey: string;
  cacheDuration: number;
  cacheNamespace: RedisNamespaces;
  queryWithCache: typeof this.query;
  queryWithCacheOverride: typeof this.query;

  constructor(label:string, query: any, cacheKey: string, cacheDuration: number, cacheNamespace: RedisNamespaces) {
    this.label = label;
    this.query = query;
    this.cacheKey = cacheKey;
    this.cacheDuration = cacheDuration;
    this.cacheNamespace = cacheNamespace;
    this.queryWithCache = this.cacheWrapHelper(false);
    this.queryWithCacheOverride = this.cacheWrapHelper(true);
  }

  cacheWrapHelper(override: boolean) {
    return (cacheDecorator.cacheWrap(
        override,
        this.query,
        this.cacheKey,
        this.cacheDuration,
        this.cacheNamespace
    ) as unknown)
  }

  startTask(...args: any) {
    daemon.startTask(this.label, () => this.queryWithCacheOverride(...args), this.cacheDuration);
  }
}