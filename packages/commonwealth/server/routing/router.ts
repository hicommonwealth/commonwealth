import type { Express } from 'express';
import express from 'express';
import useragent from 'express-useragent';
import passport from 'passport';
import * as api from '../api';

import {
  aiTieredMiddleware,
  methodNotAllowedMiddleware,
  registerRoute,
} from '../middleware/methodNotAllowed';

import { healthHandler } from '../routes/health';

import {
  CacheDecorator,
  express as expressAdapter,
} from '@hicommonwealth/adapters';
import { AppError, query } from '@hicommonwealth/core';
import { Community, User } from '@hicommonwealth/model';
import { get_atom_feed_router } from 'server/api/get-atom-feed-router';
import generateImageHandler from '../routes/generateImage';
import getUploadSignature from '../routes/getUploadSignature';
import logout from '../routes/logout';

import { generateTokenIdea } from '@hicommonwealth/model/services';
import { rateLimiterMiddleware } from 'server/middleware/rateLimiter';
import { config } from '../config';
import { aiCompletionHandler } from '../routes/ai';
import { getCanvasClockHandler } from '../routes/canvas/get_canvas_clock_handler';
import { failure } from '../types';
import { setupCosmosProxy } from '../util/comsosProxy/setupCosmosProxy';
import setupIpfsProxy from '../util/ipfsProxy';
import setupUniswapProxy from '../util/uniswapProxy';

function setupRouter(app: Express, cacheDecorator: CacheDecorator) {
  const router = express.Router();
  router.use(useragent.express());

  // API routes
  app.use(api.internal.PATH, useragent.express(), api.internal.router);
  app.use(api.external.PATH, useragent.express(), api.external.router);
  app.use(api.integration.PATH, api.integration.build());

  // MCP endpoint
  app.use(api.mcpServer.PATH, api.mcpServer.router);

  registerRoute(router, 'get', '/feed', get_atom_feed_router);

  registerRoute(
    router,
    'get',
    '/namespaceMetadata/:namespace/:stake_id',
    expressAdapter.query(Community.GetNamespaceMetadata()),
  );
  registerRoute(router, 'get', '/domain', async (req, res) => {
    const hostname = req.headers['cf-original-host'] || req.hostname;
    // return the community id matching the hostname's custom domain
    try {
      const result = await query(Community.GetByDomain(), {
        actor: { user: { id: 0, email: '' } },
        payload: { custom_domain: hostname as string },
      });
      if (result?.community_id)
        return res.json({ customDomain: result.community_id });
    } catch (e) {
      // do nothing
    }
    // otherwise, return false
    return res.json({ customDomain: null });
  });
  registerRoute(router, 'get', '/ipCountry', (req, res) => {
    const country = (req.headers['CF-IPCountry'] as string)?.toUpperCase();
    return res.json({ country });
  });
  // GET renders an intermediate page that auto-submits a POST form
  // This protects against CSRF by requiring POST for the state-changing action
  registerRoute(router, 'get', '/finishUpdateEmail', async (req, res) => {
    const { token, email } = req.query;
    if (!token || !email) {
      throw new AppError('Missing token or email parameter');
    }
    // Render an auto-submitting form to POST the actual verification
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Verifying Email...</title>
          <style>
            body { font-family: system-ui, sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background: #f5f5f5; }
            .container { text-align: center; padding: 2rem; background: white; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
            noscript { color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <p>Verifying your email...</p>
            <noscript>
              <form method="POST" action="/api/finishUpdateEmail">
                <input type="hidden" name="token" value="${token}" />
                <input type="hidden" name="email" value="${email}" />
                <button type="submit">Click here to verify your email</button>
              </form>
            </noscript>
            <form id="verifyForm" method="POST" action="/api/finishUpdateEmail">
              <input type="hidden" name="token" value="${token}" />
              <input type="hidden" name="email" value="${email}" />
            </form>
            <script>document.getElementById('verifyForm').submit();</script>
          </div>
        </body>
      </html>
    `;
    res.setHeader('Content-Type', 'text/html');
    return res.send(html);
  });

  // POST performs the actual state-changing email verification
  registerRoute(router, 'post', '/finishUpdateEmail', async (req, res) => {
    const { token, email } = req.body;
    try {
      const result = await query(User.FinishUpdateEmail(), {
        actor: { user: { id: 0, email: '' } },
        payload: { token: token as string, email: email as string },
      });
      return res.redirect(result!.redirect_path);
    } catch {
      throw new AppError('Error verifying email');
    }
  });

  // uploads
  registerRoute(
    router,
    'post',
    '/getUploadSignature',
    passport.authenticate('jwt', { session: false }),
    getUploadSignature.bind(this),
  );

  registerRoute(
    router,
    'post',
    '/generateImage',
    rateLimiterMiddleware({
      routerNamespace: 'generateImage',
      requestsPerMinute: config.GENERATE_IMAGE_RATE_LIMIT,
    }),
    passport.authenticate('jwt', { session: false }),
    aiTieredMiddleware({ images: true }),
    generateImageHandler.bind(this),
  );

  registerRoute(
    router,
    'post',
    '/generateTokenIdea',
    rateLimiterMiddleware({
      routerNamespace: 'generateTokenIdea',
      requestsPerMinute: config.GENERATE_IMAGE_RATE_LIMIT,
    }),
    passport.authenticate('jwt', { session: false }),
    aiTieredMiddleware({ images: true, text: true }),
    async (req, res) => {
      // required for streaming
      res.setHeader('Content-Type', 'text/plain');
      res.setHeader('Transfer-Encoding', 'chunked');
      const ideaPrompt =
        typeof req.body?.ideaPrompt === 'string'
          ? req.body?.ideaPrompt
          : undefined;

      const recentSuggestions = Array.isArray(req.body?.recentSuggestions)
        ? req.body.recentSuggestions.filter(
            (s: any) =>
              s && typeof s.name === 'string' && typeof s.symbol === 'string',
          )
        : [];

      const ideaGenerator = generateTokenIdea({
        ideaPrompt,
        recentSuggestions,
      });

      for await (const chunk of ideaGenerator) {
        if ((chunk as { error?: string }).error) {
          return res.end(
            JSON.stringify({
              status: 'failure',
              message: (chunk as { error?: string }).error,
            }) + '\n',
          );
        }

        res.write(chunk);
        res.flush();
      }

      return res.end();
    },
  );

  // login
  registerRoute(
    router,
    'post',
    '/auth/magic',
    passport.authenticate('magic'),
    (req, res) => {
      return res.json({ status: 'Success', result: req.user!.toJSON() });
    },
  );

  // logout
  registerRoute(router, 'post', '/logout', logout.bind(this));

  registerRoute(
    router,
    'get',
    '/getCanvasClock',
    getCanvasClockHandler.bind(this),
  );

  registerRoute(router, 'get', '/health', healthHandler.bind(this));

  registerRoute(
    router,
    'post',
    '/aicompletion',
    passport.authenticate('jwt', { session: false }),
    aiTieredMiddleware({ text: true }),
    aiCompletionHandler,
  );

  // proxies
  setupCosmosProxy(router, cacheDecorator);
  setupIpfsProxy(router, cacheDecorator);
  setupUniswapProxy(router, cacheDecorator);

  app.use('/api', router);

  app.use(methodNotAllowedMiddleware());

  app.use('/api/*', function (_req, res) {
    res.status(404);
    return failure(res, 'Not Found');
  });
}

export default setupRouter;
