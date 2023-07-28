/*
 * 1. Get window id
 * 2. Increase key `windowId:uniqueId` in redis
 * 3. Check returned value of key to know whether to allow the reqeust or lose the request
 **/

import { Redis } from "ioredis";
import { FixedWindowRatelimiter } from "./fixedWindow";

const redis = new Redis();

const fixedRatelimiter = new FixedWindowRatelimiter(redis, 10, 3);

async function main() {
  const { isRatelimitReached, totalRequst } = await fixedRatelimiter.check("1");

  console.log({ isRatelimitReached, totalRequst });
  process.exit(0);
}

main();
