import { Router } from 'express';
import { join } from 'path';

const v2Router: Router = Router();

// Serve the frame HTML
v2Router.get('/frame', (_req, res) => {
  res.sendFile(
    join(
      process.cwd(),
      'packages/commonwealth/client/scripts/components/frames/v2/index.html',
    ),
  );
});

// Contest frame endpoint
v2Router.get('/frame/:contest_address', (req, res) => {
  // TODO: Implement contest data fetching
  res.json({
    status: 'success',
    data: {
      contest_address: req.params.contest_address,
    },
  });
});

const router = v2Router;
export { router as default };
