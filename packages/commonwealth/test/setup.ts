import { vi } from 'vitest';

// Mock configuration modules before any imports
vi.mock('../libs/core/src/config.ts', () => ({
  default: {
    ALCHEMY: {
      APP_KEYS: {
        PRIVATE: 'mock-private-key',
        PUBLIC: 'mock-public-key',
      },
    },
    APP_ENV: 'local',
    SERVER_URL: 'http://localhost:8080',
    DB_URI: 'mock-db-uri',
    JWT_SECRET: 'mock-jwt-secret',
    MAGIC_API_KEY: 'mock-magic-key',
    REDIS_URL: 'mock-redis-url',
  },
}));

vi.mock('../libs/model/src/config.ts', () => ({
  default: {
    ALCHEMY: {
      APP_KEYS: {
        PRIVATE: 'mock-private-key',
        PUBLIC: 'mock-public-key',
      },
    },
  },
}));

// Mock @hicommonwealth/shared package
vi.mock('@hicommonwealth/shared', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
  utils: {
    isValidUrl: vi.fn().mockImplementation((url: string) => {
      const urlPattern = /^https?:\/\//i;
      return !urlPattern.test(url);
    }),
  },
}));

// Mock react-router-dom functions
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => vi.fn(),
    useLocation: () => ({ pathname: '/test' }),
  };
});
