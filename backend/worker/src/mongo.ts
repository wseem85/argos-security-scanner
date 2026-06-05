//woker/src/db/mongo.ts
// MongoClient : a class for connecting mongoDB and managing connections (connecting the Mongo Server)
// Db : represents a specific database withing a MongoDB(connecting our database and managing tables)
import { MongoClient, Db } from 'mongodb';
// importing env variables, the ! is assertion it tells typescript that i guarntee this variableis not undeined or null
const url = process.env.MONGO_URL!;
const dbName = process.env.MONGO_DB!;

let client: MongoClient;
let db: Db;

export async function connectMongo() {
  if (db) return db;

  client = new MongoClient(url);
  await client.connect();

  db = client.db(dbName);

  console.log('Connected to MongoDB');
  console.log('Mongo URL:', url);
  console.log('Mongo DB :', dbName);

  return db;
}

// ✅ NEW: Helper to insert scan results
export async function insertScanResult(result: any) {
  const mongoDb = await connectMongo();
  const collection = mongoDb.collection('scan_results');
  return await collection.insertOne(result);
}

// ✅ NEW: Helper to get all results for a scan
export async function getScanResults(scanId: string) {
  const mongoDb = await connectMongo();
  const collection = mongoDb.collection('scan_results');
  return await collection.find({ scanId }).toArray();
}
