declare namespace NodeJS {
  interface ProcessEnv {
    // Server
    NODE_ENV: 'development' | 'production' | 'test';
    PORT: string;

    // Database
    MONGODB_URI: string;

    // JWT
    JWT_SECRET: string;
    JWT_REFRESH_SECRET: string;
    JWT_EXPIRES_IN: string;
    JWT_REFRESH_EXPIRES_IN: string;

    // Blockchain
    BLOCKCHAIN_RPC_URL: string;
    BLOCKCHAIN_PRIVATE_KEY: string;
    BLOCKCHAIN_CONTRACT_ADDRESS?: string;
    BLOCKCHAIN_NETWORK: string;

    // CORS
    CORS_ORIGIN: string;

    // Rate Limiting
    RATE_LIMIT_WINDOW_MS: string;
    RATE_LIMIT_MAX_REQUESTS: string;
  }
}

export {};
