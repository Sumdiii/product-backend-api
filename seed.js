const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' 
    ? { rejectUnauthorized: false } : false
});

const categories = [
  'Electronics','Clothing','Food','Books','Toys'
];

async function seedDatabase() {
  const client = await pool.connect();
  try {
    console.log('Clearing old data...');
    await client.query('DELETE FROM products');

    const batchSize = 1000;
    const total = 200000;

    for (let i = 0; i < total; i += batchSize) {
      const values = [];
      const placeholders = [];

      for (let j = 0; j < batchSize && i + j < total; j++) {
        const idx = i + j;
        const cat = categories[idx % categories.length];
        const name = `Product ${idx + 1}`;
        const price = (Math.random() * 1000).toFixed(2);
        const daysAgo = Math.floor(Math.random() * 365);

        placeholders.push(
          `($${values.length+1},$${values.length+2},$${values.length+3},NOW()-INTERVAL '${daysAgo} days')`
        );
        values.push(name, cat, price);
      }

      await client.query(
        `INSERT INTO products(name,category,price,created_at) VALUES ${placeholders.join(',')}`,
        values
      );
      console.log(`Inserted ${Math.min(i+batchSize, total)} / ${total}`);
    }
    console.log('Seed complete!');
    process.exit(0);
  } catch(e) {
    console.error(e);
    process.exit(1);
  } finally {
    client.release();
  }
}

seedDatabase();