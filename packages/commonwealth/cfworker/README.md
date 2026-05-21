This Cloudflare Worker rewrites all incoming requests from custom domains 
so that they connect to your Railway app origin (common.xyz),
fixing the issue where Railway routes requests by Host header.

# Setup & Deployment
1. Authenticate with Cloudflare `pnpm wrangler login`
2. Deploy the Worker `pnpm wrangler deploy`