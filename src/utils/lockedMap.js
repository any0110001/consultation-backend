import { Mutex } from 'async-mutex';

/**
 * LockedMap is simply a Map with a mutex lock to be used under concurrency
 */
export class LockedMap {
  constructor() {
    this.map = new Map();
    this.mutex = new Mutex(); // A Map to store mutexes for each key.
  }

  // Lock a key (returns an unlock function)
  async lock() {
    const release = await this.mutex.acquire(); // Acquire lock
    return release; // Return release function for manual unlocking
  }

  // Release a key
  release() {
    if (this.mutex.isLocked()) {
      throw new Error("Cannot manually release lock while it is still acquired.");
    }
  }

  async get(key) {
    return this.map.get(key);
  }

  async set(key, value) {
    this.map.set(key, value);
  }

  async delete(key) {
    return this.map.delete(key);
  }

  async has(key) {
    return this.map.has(key);
  }
}
