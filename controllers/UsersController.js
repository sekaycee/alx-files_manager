import { ObjectId } from 'mongodb';
import Queue from 'bull';

const crypto = require('crypto');
const dbClient = require('../utils/db');
const redisClient = require('../utils/redis');

function hashPasswd(password) {
  const hash = crypto.createHash('sha1');
  const data = hash.update(password, 'utf-8');
  // Creating the hash in the required format
  const genHash = data.digest('hex');
  return genHash;
}

const userQ = new Queue('userQ');

class UsersController {
  static async postNew(req, res) {
    const { email, password } = req.body;
    if (!email) return res.status(400).json({ error: 'Missing email' });
    if (!password) return res.status(400).json({ error: 'Missing password' });

    const emailExists = await dbClient.db.collection('users').findOne({ email });
    if (emailExists) return res.status(400).json({ error: 'Already exist' });

    const secPass = hashPasswd(password);
    const insertUser = await dbClient.db.collection('users').insertOne({
      email,
      'password': secPass,
    });
    const createdUser = {
      'id': insertUser.insertedId,
      email,
    };

    await userQ.add({
      'userId': insertUser.insertedId.toString(),
    });

    return res.status(201).json(createdUser);
  }

  static async getMe(req, res) {
    const key = req.header('X-Token');
    const session = await redisClient.get(`auth_${key}`);
    if (!key || key.length === 0) return res.status(401).json({ error: 'Unauthorized' });
    if (session) {
      const search = await dbClient.db.collection('users').find({ '_id': ObjectId(session) }).toArray();
      return (res.status(200).json({ id: search[0]._id, email: search[0].email }));
    }
    return (res.status(401).json({ error: 'Unauthorized' }));
  }
}

module.exports = UsersController;
