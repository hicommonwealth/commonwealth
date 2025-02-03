# Commonwealth Mini App

A mini app implementation for Commonwealth, currently supporting Telegram Mini Apps.

## Overview

This package provides a mini app implementation for Commonwealth, allowing users to interact with Commonwealth features directly within messaging platforms. The current implementation focuses on Telegram Mini Apps, providing a seamless integration between Commonwealth and Telegram.

## Features

- Telegram Bot Integration
- Mini App Authentication with Common
- /raids and /contests

## Architecture

The package is structured to support multiple platforms in the future while maintaining clean separation of concerns:

```
src/
├── bot/           # Bot implementation
├── client/        # Mini App UI components
└── shared/        # Shared utilities and types
```

## Future Platform Support

While this package currently focuses on Telegram Mini Apps, it's designed with multi-platform support in mind. The architecture is structured to eventually support other platforms like:

- Farcaster Frames (currently in development in the main app)
- Discord Apps
- WeChat Mini Programs
- And more...

This aligns with Commonwealth's goal of meeting users where they are and providing seamless integration across various social and messaging platforms.

## Development

### Prerequisites

- Node.js v22 or later
- PNPM package manager
- Telegram Bot Token (for development)

### Setup

1. Install dependencies:
   ```bash
   pnpm install
   ```

2. Create a .env file with your Telegram Bot Token:
   ```
   TELEGRAM_BOT_TOKEN=your_bot_token_here
   ```

3. Start development:
   ```bash
   pnpm dev
   ```

### Testing

```bash
pnpm test
```

## Contributing

[Contributing guidelines...]

## License

Same as Commonwealth main repository. 