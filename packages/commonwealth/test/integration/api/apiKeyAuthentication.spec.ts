import { command } from '@hicommonwealth/core';
import { User, models, tester } from '@hicommonwealth/model';
import { User as UserSchema } from '@hicommonwealth/schemas';
import { NextFunction, Request, Response } from 'express';
import { beforeAll, describe, expect, test, vi } from 'vitest';
import { z } from 'zod';
import { apiKeyAuthMiddleware } from '../../../server/api/external-router-middleware';

describe('API KeyAuthentication', () => {
  let apiKey: string;
  let user: z.infer<typeof UserSchema>;
  let admin: z.infer<typeof UserSchema>;
  const address = '0xrealaddress';
  const adminAddress = '0xadminaddress';

  beforeAll(async () => {
    const [node] = await tester.seed('ChainNode', { eth_chain_id: 1 });
    user = await models.User.create({
      email: 'test@gmail.com',
      isAdmin: false,
      emailVerified: true,
      promotional_emails_enabled: false,
      profile: {},
    });
    admin = await models.User.create({
      email: 'admin@gmail.com',
      isAdmin: false,
      emailVerified: true,
      promotional_emails_enabled: false,
      profile: {},
    });
    const [_community] = await tester.seed('Community', {
      chain_node_id: node!.id!,
      active: true,
      profile_count: 1,
      Addresses: [
        {
          address: adminAddress,
          user_id: admin!.id!,
          role: 'admin',
          is_banned: false,
          verified: new Date(),
        },
        {
          address,
          user_id: user!.id!,
          role: 'member',
          is_banned: false,
          verified: new Date(),
        },
      ],
      groups: [],
      topics: [],
      CommunityStakes: [],
      custom_stages: ['one', 'two'],
    });
  });

  test('should ignore doc and openAPI requests', async () => {
    const next = vi.fn(() => 0);
    await apiKeyAuthMiddleware(
      { path: '/docs/' } as Request,
      {} as Response,
      next as NextFunction,
    );
    expect(next).toHaveBeenCalledOnce();
  });

  test('should authenticate successfully with a valid api key and address', async () => {
    const res = await command(User.CreateApiKey(), {
      actor: {
        user: {
          id: user.id!,
          email: 'test@gmail.com',
        },
        address,
      },
      payload: {},
    });
    expect(res).toBeTruthy();
    expect(res!.api_key).toBeTruthy();
    apiKey = res!.api_key!;

    const next = vi.fn(() => 0);
    const req = {
      path: '/CreateCommunity',
      headers: {
        address,
        'x-api-key': apiKey,
      },
    } as unknown as Request;
    await apiKeyAuthMiddleware(req, {} as Response, next as NextFunction);
    expect(req.user).toBeTruthy();
    expect(req.user!.id).to.equal(user.id!);
    expect(next).toHaveBeenCalledOnce();
  });

  test('should throw 401 error if api key is not provided', async () => {
    const next = vi.fn(() => 0);
    const req = {
      path: '/CreateCommunity',
      headers: {
        address,
      },
    } as unknown as Request;
    expect(
      apiKeyAuthMiddleware(req, {} as Response, next as NextFunction),
    ).rejects.toThrowError('Unauthorized');
    expect(next).not.toHaveBeenCalled();
    expect(req.user).toBeFalsy();
  });

  test.each([
    { value: true, type: 'boolean' },
    { value: 1, type: 'number' },
    {
      value: { test: 'hi' },
      type: 'object',
    },
    { value: ['test'], type: 'array' },
  ])(`should throw 401 error if api key is a $type`, async ({ value }) => {
    const next = vi.fn(() => 0);
    const req = {
      path: '/CreateCommunity',
      headers: {
        'x-api-key': value,
        address,
      },
    } as unknown as Request;
    expect(
      apiKeyAuthMiddleware(req, {} as Response, next as NextFunction),
    ).rejects.toThrowError('Unauthorized');
    expect(next).not.toHaveBeenCalled();
    expect(req.user).toBeFalsy();
  });

  test('should throw 401 error if address header is not provided', async () => {
    const next = vi.fn(() => 0);
    const req = {
      path: '/CreateCommunity',
      headers: {
        'x-api-key': apiKey,
      },
    } as unknown as Request;
    expect(
      apiKeyAuthMiddleware(req, {} as Response, next as NextFunction),
    ).rejects.toThrowError('Unauthorized');
    expect(next).not.toHaveBeenCalled();
    expect(req.user).toBeFalsy();
  });

  test.each([
    { value: true, type: 'boolean' },
    { value: 1, type: 'number' },
    {
      value: { test: 'hi' },
      type: 'object',
    },
    { value: ['test'], type: 'array' },
  ])(`should throw 401 error if address is a $type`, async ({ value }) => {
    const next = vi.fn(() => 0);
    const req = {
      path: '/CreateCommunity',
      headers: {
        'x-api-key': apiKey,
        address: value,
      },
    } as unknown as Request;
    expect(
      apiKeyAuthMiddleware(req, {} as Response, next as NextFunction),
    ).rejects.toThrowError('Unauthorized');
    expect(next).not.toHaveBeenCalled();
    expect(req.user).toBeFalsy();
  });

  test('should throw 401 error if an address is not found', async () => {
    const next = vi.fn(() => 0);
    const req = {
      path: '/CreateCommunity',
      headers: {
        'x-api-key': apiKey,
        address: '0x123',
      },
    } as unknown as Request;
    expect(
      apiKeyAuthMiddleware(req, {} as Response, next as NextFunction),
    ).rejects.toThrowError('Unauthorized');
    expect(next).not.toHaveBeenCalled();
    expect(req.user).toBeFalsy();
  });

  test('should throw 401 error if user does not have an api key in the DB', async () => {
    const next = vi.fn(() => 0);
    const req = {
      path: '/CreateCommunity',
      headers: {
        'x-api-key': apiKey,
        address: adminAddress,
      },
    } as unknown as Request;
    expect(
      apiKeyAuthMiddleware(req, {} as Response, next as NextFunction),
    ).rejects.toThrowError('Unauthorized');
    expect(next).not.toHaveBeenCalled();
    expect(req.user).toBeFalsy();
  });

  test('should throw 401 error if given api key does not match expected hash', async () => {
    const next = vi.fn(() => 0);
    const req = {
      path: '/CreateCommunity',
      headers: {
        'x-api-key': 'some-type-valid-api-key',
        address,
      },
    } as unknown as Request;
    expect(
      apiKeyAuthMiddleware(req, {} as Response, next as NextFunction),
    ).rejects.toThrowError('Unauthorized');
    expect(next).not.toHaveBeenCalled();
    expect(req.user).toBeFalsy();
  });
});
