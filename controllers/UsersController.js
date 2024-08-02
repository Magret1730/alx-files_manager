import sha1 from 'sha1';
import dbClient from '../utils/db';

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

      return res.status(201).json({
        id: newUser.insertedId,
        email,
      });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }
}

export default UsersController;
