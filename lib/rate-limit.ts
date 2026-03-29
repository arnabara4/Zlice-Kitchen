import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Create a Redis instance
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Rate limiter for login endpoints - stricter limits
export const loginRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(20, "15 m"), // 20 attempts per 15 minutes
  analytics: true,
  prefix: "@upstash/ratelimit/login",
});

// Rate limiter for general API endpoints
export const apiRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(100, "1 m"), // 100 requests per minute
  analytics: true,
  prefix: "@upstash/ratelimit/api",
});

// Rate limiter for order placement - moderate limits
export const orderRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(20, "1 m"), // 20 orders per minute
  analytics: true,
  prefix: "@upstash/ratelimit/orders",
});

// Rate limiter for user registration/signup
export const signupRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(20, "1 h"), // 20 attempts per hour
  analytics: true,
  prefix: "@upstash/ratelimit/signup",
});
