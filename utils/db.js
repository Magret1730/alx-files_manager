import { MongoClient } from 'mongodb';

// const client = new MongoClient(mongodb://host:port);

class DBClient {
  constructor() {
    const host = process.env.DB_HOST || 'localhost';
    const port = process.env.DB_PORT || 27017;
    const database = process.env.DB_DATABASE || 'files_manager';

    this.uri = `mongodb://${host}:${port}`;
    this.client = new MongoClient(this.uri, { useNewUrlParser: true, useUnifiedTopology: true });
    this.databaseName = database;
    this.isConnected = false;

    this.connect();
  }

  async connect() {
    try {
      await this.client.connect();
      this.isConnected = true;
      console.log('Connected to MongoDB successfully');
      return true;
    } catch (err) {
      console.log(`Failed to connect to MongoDB ${err.message}`);
      this.isConnected = false;
      return false;
    }
  }

  isAlive() {
    return this.client.topology.isConnected();
  }

  async nbUsers() {
    if (!this.isConnected) {
      console.log('Not connected to MongoDB from nbUsers');
      return false;
    }

    try {
      const database = this.client.db(this.databaseName);
      const users = database.collection('users');
      const countUsers = await users.countDocuments();
      return countUsers;
    } catch (err) {
      console.log(`Failed to retrieve user count: ${err.message}`);
      return 0;
    }
  }

  async nbFiles() {
    if (!this.isConnected) {
      console.log('Not connected to MongoDB from nbFiles');
      return false;
    }

    try {
      const database = this.client.db(this.databaseName);
      const files = database.collection('files');
      const countFiles = await files.countDocuments();
      return countFiles;
    } catch (err) {
      console.log(`Failed to retrieve file count: ${err.message}`);
      return 0;
    }
  }

  async close() {
    try {
      await this.client.close();
      console.log('Successfully disconnected from MongoDB');
    } catch (err) {
      console.log(`Failed to disconnect from MongoDB ${err.message}`);
    }
  }
}

const dbClient = new DBClient();
export default dbClient;
