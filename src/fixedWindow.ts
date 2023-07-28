import { Redis } from "ioredis";

export class FixedWindowRatelimiter {
  #db: Redis;
  #window: number;
  #limit: number;

  constructor(redis: Redis, window: number, limit: number) {
    this.#db = redis;
    this.#window = window;
    this.#limit = limit;
  }

  #getKey(unqiueId: string) {
    const windowId = Math.floor(Date.now() / (this.#window * 1_000));
    const redisKey = `${windowId}:${unqiueId}`;
    return redisKey;
  }

  async check(uniqueId: string) {
    const redisKey = this.#getKey(uniqueId);

    const [[incrError, incrRes]] = (await this.#db
      .multi()
      .incr(redisKey)
      .expire(redisKey, this.#window)
      .exec())!;

    if (incrError) {
      throw incrError;
    }

    const totalRequst = incrRes as number;
    const isRatelimitReached = totalRequst > this.#limit;

    return { isRatelimitReached, totalRequst };
  }
}
