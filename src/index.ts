/*
 * 1. Get window id
 * 2. Increase key `windowId:uniqueId` in redis
 * 3. Check returned value of key to know whether to allow the reqeust or lose the request
 **/

import { Redis } from "ioredis";
import { FixedWindowRatelimiter } from "./fixedWindow";
import { SlidingWindowRatelimiter } from "./slidingWindow";

const redis = new Redis();

const fixedRatelimiter = new SlidingWindowRatelimiter(redis, 10, 3);

async function main() {
  const { isRatelimitReached, totalRequest } = await fixedRatelimiter.check(
    "1"
  );

  console.log({ isRatelimitReached, totalRequest });
  process.exit(0);
}

main();
