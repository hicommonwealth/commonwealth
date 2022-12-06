  const ruleCache = new RuleCache();
  let rc = null;
  if (SHOULD_SEND_EMAILS) {
    rc = await sendBatchedNotificationEmails(models);
  } else if (FLAG_MIGRATION) {
    log.info('Started migrating councillor and validator flags into the DB');
    try {
      await migrateCouncillorValidatorFlags(models);
      log.info('Finished migrating councillor and validator flags into the DB');
      rc = 0;
    } catch (e) {
      log.error(
        'Failed migrating councillor and validator flags into the DB: ',
        e.message
      );
      rc = 1;
    }
  }

  // exit if we have performed a one-off event
  if (rc !== null) {
    process.exit(rc);
  }

  const WITH_PRERENDER = process.env.WITH_PRERENDER;
  const NO_PRERENDER = process.env.NO_PRERENDER || NO_CLIENT_SERVER;

  const compiler = DEV
    ? webpack(devWebpackConfig as any)
    : webpack(prodWebpackConfig as any);
  const SequelizeStore = SessionSequelizeStore(session.Store);
  const devMiddleware =
    DEV && !NO_CLIENT_SERVER
      ? webpackDevMiddleware(compiler as any, {
        publicPath: '/build',
      })
      : null;
  const viewCountCache = new ViewCountCache(2 * 60, 10 * 60);

  const closeMiddleware = (): Promise<void> => {
    if (!NO_CLIENT_SERVER) {
      return new Promise((resolve) => devMiddleware.close(() => resolve()));
    } else {
      return Promise.resolve();
    }
  };


  const sessionStore = new SequelizeStore({
    db: models.sequelize,
    tableName: 'Sessions',
    checkExpirationInterval: 15 * 60 * 1000, // Clean up expired sessions every 15 minutes
    expiration: 7 * 24 * 60 * 60 * 1000, // Set session expiration to 7 days
  });

  sessionStore.sync();

  const sessionParser = session({
    secret: SESSION_SECRET,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
  });

  const setupMiddleware = () => {
    // redirect from commonwealthapp.herokuapp.com to commonwealth.im
    app.all(/.*/, (req, res, next) => {
      const host = req.header('host');
      if (host.match(/commonwealthapp.herokuapp.com/i)) {
        res.redirect(301, `https://commonwealth.im${req.url}`);
      } else {
        next();
      }
    });

    // redirect to https:// unless we are using a test domain
    app.use(
      redirectToHTTPS([/localhost:(\d{4})/, /127.0.0.1:(\d{4})/], [], 301)
    );

    // dynamic compression settings used
    app.use(compression());

    // static compression settings unused
    // app.get('*.js', (req, res, next) => {
    //   req.url = req.url + '.gz';
    //   res.set('Content-Encoding', 'gzip');
    //   res.set('Content-Type', 'application/javascript; charset=UTF-8');
    //   next();
    // });

    // // static compression settings unused
    // app.get('bundle.**.css', (req, res, next) => {
    //   req.url = req.url + '.gz';
    //   res.set('Content-Encoding', 'gzip');
    //   res.set('Content-Type', 'text/css');
    //   next();
    // });

    // serve the compiled app
    if (!NO_CLIENT_SERVER) {
      if (DEV) {
        app.use(devMiddleware);
        app.use(webpackHotMiddleware(compiler));
      } else {
        app.use('/build', express.static('build'));
      }
    }

    // add security middleware
    app.use(function applyXFrameAndCSP(req, res, next) {
      res.set('X-Frame-Options', 'DENY');
      res.set('Content-Security-Policy', "frame-ancestors 'none';");
      next();
    });

    // serve static files
    app.use(favicon(`${__dirname}/favicon.ico`));
    app.use('/static', express.static('static'));

    // add other middlewares
    app.use(logger('dev'));
    app.use(expressStatsdInit(StatsDController.get()));
    app.use(bodyParser.json({limit: '1mb'}));
    app.use(bodyParser.urlencoded({limit: '1mb', extended: false}));
    app.use(cookieParser());
    app.use(sessionParser);
    app.use(passport.initialize());
    app.use(passport.session());
    app.use(prerenderNode.set('prerenderServiceUrl', 'http://localhost:3000'));
  };

  const templateFile = (() => {
    try {
      return fs.readFileSync('./build/index.html');
    } catch (e) {
      console.error(`Failed to read template file: ${e.message}`);
    }
  })();

  const sendFile = (res) => res.sendFile(`${__dirname}/build/index.html`);

  // Only run prerender in DEV environment if the WITH_PRERENDER flag is provided.
  // On the other hand, run prerender by default on production.
  if (DEV) {
    if (WITH_PRERENDER) setupPrerenderServer();
  } else {
    if (!NO_PRERENDER) setupPrerenderServer();
  }

  setupMiddleware();
  setupPassport(models);

  const rollbar = new Rollbar({
    accessToken: ROLLBAR_SERVER_TOKEN,
    environment: process.env.NODE_ENV,
    captureUncaught: true,
    captureUnhandledRejections: true,
  });

  let rabbitMQController: RabbitMQController;
  try {
    rabbitMQController = new RabbitMQController(
      <BrokerConfig>getRabbitMQConfig(RABBITMQ_URI)
    );
    await rabbitMQController.init();
  } catch (e) {
    console.warn("The main service RabbitMQController failed to initialize!", e)
    rollbar.critical("The main service RabbitMQController failed to initialize!", e)
  }

  if (!rabbitMQController.initialized) {
    console.warn("The RabbitMQController is not initialized! Some services may be unavailable e.g. (Create/Delete chain and Websocket notifications")
    rollbar.critical("The main service RabbitMQController is not initialized!");
    // TODO: this requires an immediate response if in production
  }

  if (!NO_TOKEN_BALANCE_CACHE) await tokenBalanceCache.start();
  await ruleCache.start();
  const banCache = new BanCache(models);
  setupAPI(
    app,
    models,
    viewCountCache,
    tokenBalanceCache,
    ruleCache,
    banCache
  );
  setupCosmosProxy(app, models);
  setupIpfsProxy(app);
  setupEntityProxy(app);
  setupAppRoutes(app, models, devMiddleware, templateFile, sendFile);

  setupErrorHandlers(app, rollbar);

  if (CHAIN_EVENTS) {
    const exitCode = await listenChainEvents();
    console.log(`setup chain events listener with code: ${exitCode}`);
    if (exitCode) {
      await models.sequelize.close();
      await closeMiddleware();
      process.exit(exitCode);
    }
  }
  startSnapshotConsumer();
  setupServer(app, rollbar, models, rabbitMQController);
}

main();
export default app;
