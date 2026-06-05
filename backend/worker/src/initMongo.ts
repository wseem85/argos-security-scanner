import { connectMongo } from './mongo';
export async function initMongo() {
  const db = await connectMongo();

  const collection = db.collection('scan_results');

  await collection.createIndex({ scanId: 1 });
  await collection.createIndex({ target: 1 });
  console.log('Mongo indexes ensured');
}
