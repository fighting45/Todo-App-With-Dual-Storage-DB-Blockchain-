export const CONSTANTS = {
  // Pagination
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100,

  // JWT
  JWT_COOKIE_NAME: 'refreshToken',

  // Bcrypt
  BCRYPT_ROUNDS: 12,

  // Rate Limiting
  RATE_LIMIT: {
    GENERAL: {
      WINDOW_MS: 15 * 60 * 1000, // 15 minutes
      MAX_REQUESTS: 100,
    },
    AUTH: {
      WINDOW_MS: 15 * 60 * 1000, // 15 minutes
      MAX_REQUESTS: 5,
    },
    ADMIN: {
      WINDOW_MS: 15 * 60 * 1000, // 15 minutes
      MAX_REQUESTS: 200,
    },
  },

  // Blockchain
  BLOCKCHAIN: {
    MAX_RETRY_ATTEMPTS: 10,
    RETRY_DELAYS: [0, 60000, 300000, 900000, 3600000, 21600000], // 0, 1m, 5m, 15m, 1h, 6h
    SYNC_JOB_INTERVAL: 300000, // 5 minutes
  },

  // Todo
  TODO: {
    MAX_TITLE_LENGTH: 200,
    MAX_DESCRIPTION_LENGTH: 2000,
  },
} as const;
