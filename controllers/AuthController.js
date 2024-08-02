// import { Buffer } from 'node:buffer';
import { v4 as uuidv4 } from 'uuid';
// import { promisify } from 'util';
import sha1 from 'sha1';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';

class AuthController {
  static async getConnect(req, res) {
    // Get Authorization header
    const authHeader = req.headers.authorization;
    if (!(authHeader && authHeader.startsWith('Basic '))) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Extract base64 encoded credentials
    const base64Credentials = authHeader.slice(6);
    const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
    const [email, password] = credentials.split(':');
    // console.log(`email: ${email}`);
    // console.log(`password: ${password}`);

    if (!(email || password)) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
      const database = dbClient.client.db(dbClient.databaseName);
      const users = database.collection('users');
      // console.log(`Users db: ${users}`);

      const hashedPassword = await sha1(password);
      if (!hashedPassword) {
        return res.status(500).send('Could not encrypt password');
      }

      const user = await users.findOne({ email, password: hashedPassword });
      // console.log(`User: ${user}`);
      if (!user) {
        return res.status(400).json({ error: 'Unauthorized' });
      }

      const token = uuidv4();
      const key = `auth_${token}`;

      const result = await redisClient.set(key, user._id.toString(), 24 * 60 * 60);
      // console.log(`Result getConnect: ${result}`);
      if (!result) {
        console.error(`Failed to store token ${token} in Redis`);
        return res.status(500).json({ error: 'Internal server error' });
      }

      return res.status(200).json({ token });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  static async getDisconnect(req, res) {
    // const database = dbClient.client.db(dbClient.databaseName);
    // const currentUser = database.collection('users');

    // const user = await currentUser.findOne({ token });
    // if (user) {
    //   return res.status(401).json({ error: 'Unauthorized' });
    // }

    const token = req.headers['x-token'];
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const key = `auth_${token}`;

    try {
      const userId = await redisClient.getAsync(key);
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      await redisClient.delAsync(key);
      return res.status(204).send();
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }
}

export default AuthController;
