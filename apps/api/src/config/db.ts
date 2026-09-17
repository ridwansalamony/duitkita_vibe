import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/finance_db';
let client: MongoClient | null = null;

export async function getDbClient() {
  if (!client) {
    client = new MongoClient(uri);
    await client.connect();
    console.log('Connected to MongoDB Atlas / Database');
  }
  return client;
}

export async function getDatabase(dbName?: string) {
  const c = await getDbClient();
  return c.db(dbName);
}
