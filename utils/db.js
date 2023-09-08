import { MongoClient } from 'mongodb';

const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_PORT = process.env.DB_PORT || 27017;
const DB_DATABASE = process.env.DB_DATABASE || 'files_manager';
const url = `mongodb://${DB_HOST}:${DB_PORT}`;

class DBClient {
  constructor() {
    this.client = new MongoClient(url, { useUnifiedTopology: true });
    this.client.connect();
    this.db = this.client.db(DB_DATABASE);
  }

  isAlive() {
    if (this.client.isConnected()) return true;
    return false;
  }

  async nbUsers() {
    const collection = await this.db.collection('users');
    return collection.countDocuments();
  }

  async nbFiles() {
    const collection = await this.db.collection('files');
    return collection.countDocuments();
  }
}
const dbClient = new DBClient();
export default dbClient;
