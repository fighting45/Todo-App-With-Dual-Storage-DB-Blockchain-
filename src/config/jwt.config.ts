export const jwtConfig = {
  secret: process.env.JWT_SECRET || 'default-secret-change-in-production',
  refreshSecret: process.env.JWT_REFRESH_SECRET || 'default-refresh-secret-change-in-production',
  expiresIn: process.env.JWT_EXPIRES_IN || '15m',
  refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
};

if (process.env.NODE_ENV === 'production') {
  if (
    jwtConfig.secret === 'default-secret-change-in-production' ||
    jwtConfig.refreshSecret === 'default-refresh-secret-change-in-production'
  ) {
    throw new Error('JWT secrets must be set in production environment');
  }
}
