import Bull from 'bull';
import sha1 from 'sha1';
import { ObjectId } from 'mongodb';
import redisClient from '../utils/redis';
import dbClient from '../utils/db';

// Create a new Bull queue
const userQueue = new Bull('userQueue');

class UsersController {
  static async postNew(req, res) {
    const { email, password } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Missing email' });
    }

    if (!password) {
      return res.status(400).json({ error: 'Missing password' });
    }

    try {
      const database = dbClient.client.db(dbClient.databaseName);
      const users = database.collection('users');

      const existingUser = await users.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ error: 'Already exist' });
      }

      const hashedPassword = await sha1(password);
      if (!hashedPassword) {
        return res.status(500).send('Could not encrypt password');
      }

      const newUser = await users.insertOne({
        email, password: hashedPassword,
      });

      // Add a job to the userQueue for sending a welcome email
      userQueue.add({ userId: newUser.insertedId.toString() });

      return res.status(201).json({
        id: newUser.insertedId,
        email,
      });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  static async getMe(req, res) {
    // console.log('req.headers getMe: ', req.headers);
    const token = req.headers['x-token'];
    // console.log(`Token getMe: ${token}`);
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const key = `auth_${token}`;
    // console.log(`Key getMe: ${key}`);

    try {
      const userId = await redisClient.getAsync(key);
      // console.log(`userId getMe: ${userId}`);

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const database = dbClient.client.db(dbClient.databaseName);
      const users = database.collection('users');
      const user = await users.findOne({ _id: new ObjectId(userId) });
      // console.log(`users getMe: ${user}`);
      if (!user) {
        return res.status(401).json({ error: 'Unauthorizedd' });
      }

      return res.status(201).json({
        id: user._id,
        email: user.email,
      });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }
}

export default UsersController;
