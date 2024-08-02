import dbClient from '../utils/db';
import redisClient from '../utils/redis';

const getStatus = async (req, res) => {
  try {
    const redisAlive = await redisClient.isAlive();
    const dbAlive = await dbClient.isAlive();

    res.status(200).json({
      redis: redisAlive,
      db: dbAlive,
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

const getStats = async (req, res) => {
  try {
    const usersCount = await dbClient.nbUsers();
    const filesCount = await dbClient.nbFiles();

    res.status(200).json({
      users: usersCount,
      files: filesCount,
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export { getStatus, getStats };
