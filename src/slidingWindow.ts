import { Redis } from "ioredis";

export class SlidingWindowRatelimiter {
  #db: Redis;
  #window: number;
  #limit: number;

  constructor(db: Redis, window: number, limit: number) {
    this.#db = db;
    this.#window = window;
    this.#limit = limit;
  }

  async check(unqiueId: string) {
    const now = Date.now();

    const currentWindow = Math.floor(now / (this.#window * 1000));
    const previousWindow = currentWindow - 1;

    const currentWindowWeight = (now % this.#window) / this.#window;

    const currentWindowKey = `${currentWindow}:${unqiueId}`;
    const previousWindowKey = `${previousWindow}:${unqiueId}`;

    const [[getErr, prevReqInStr], [incrErr, currReq]] = (await this.#db
      .multi()
      .get(previousWindowKey)
      .incr(currentWindowKey)
      .expire(currentWindowKey, this.#window * 2 + 1, "NX")
      .exec())!;

    if (getErr || incrErr) {
      throw getErr || incrErr;
    }

    if (prevReqInStr !== null && typeof prevReqInStr !== "string") {
      throw Error("Unknown type of previos window count");
    }

    if (typeof currReq !== "number") {
      throw Error("Unknown type of current window request count");
    }

    const prevReq = parseInt(prevReqInStr || "0", 10);

    const weightedPrevCount = Math.floor(prevReq * (1 - currentWindowWeight));
    const totalRequestCount = weightedPrevCount + currReq;

    const isRatelimitReached = totalRequestCount > this.#limit;

    return { isRatelimitReached, totalRequest: totalRequestCount };
  }
}
