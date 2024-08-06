import redis from 'redis';
import { promisify } from 'util';

class RedisClient {
  constructor() {
    this.client = redis.createClient();

    this.client.on('error', (err) => {
      console.error(`Redis client not connected to the server: ${err.message}`);
    });

    this.client.on('connect', () => {
      console.log('Redis client connected to the server');
    });

    // Promisify Redis client methods
    this.getAsync = promisify(this.client.get).bind(this.client);
    this.setAsync = promisify(this.client.set).bind(this.client);
    this.delAsync = promisify(this.client.del).bind(this.client);
    // this.pingAsync = promisify(this.client.ping).bind(this.client);
  }

  isAlive() {
    return this.client.connected;
  }

  async get(key) {
    // this.getAsync = promisify(this.client.get).bind(this.client);
    try {
      const value = await this.getAsync(key);
      return value;
    } catch (err) {
      return (`Can't get ${key}: ${err.message}`);
    }
  }

  async set(key, value, duration) {
    // this.setAsync = promisify(this.client.set).bind(this.client);
    try {
      await this.setAsync(key, value, 'EX', duration);
      return `Key ${key} set successfully`;
    } catch (err) {
      return (`Can't set ${key} of value ${value}: ${err.message}`);
    }
  }

  async del(key) {
    // this.delAsync = promisify(this.client.del).bind(this.client);
    try {
      return await this.delAsync(key);
    } catch (err) {
      return (`Can't delete ${key}: ${err.message}`);
    }
  }
}

const redisClient = new RedisClient();
export default redisClient;
