const { MongoClient } = require('mongodb');

const uri = process.env.MONGO_URI;
let client, db;

async function connect() {
  if (!client) {
    client = new MongoClient(uri, { useUnifiedTopology: true });
    await client.connect();
    console.log(' Connected to MongoDB');
    db = client.db();            // uses DB name from URI path
  }
  return db;
}

module.exports = { connect };
