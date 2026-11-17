const {
  MONGODB_URI,
  JWT_SECRET,
  PORT = "3000",
  COOKIE_SECURE = "true",
} = process.env;

if (!MONGODB_URI || !JWT_SECRET)
  throw new Error("MONGODB_URI and JWT_SECRET must be set");

export const config = {
  mongoUri: MONGODB_URI,
  jwtSecret: JWT_SECRET,
  port: Number(PORT),
  cookieSecure: COOKIE_SECURE !== "false",
};
