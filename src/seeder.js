const { Pool } = require('pg');
const { faker }= require('@faker-js/faker');

// create a new instance of PrismaClient
const pool = new Pool({
  connectionString: "postgresql://Mohmn:o7el5hzJNgIE@ep-lucky-dew-94214037.ap-southeast-1.aws.neon.tech/neondb?sslmode=require"
})
async function insertCategory(name) {
  const text = 'INSERT INTO "public"."Category"(name) VALUES($1) ON CONFLICT (name) DO NOTHING';
  const values = [name];

  try {
    await pool.query(text, values);
  } catch (err) {
    console.error(err.stack);
  }
}

async function loadCategories() {
  for (let i = 0; i < 100; i++) {
    // Using a more reliable method to generate random data
    const categoryName = faker.commerce.productName(); // Try using productName if department is not available
    console.log('Category:', categoryName);
    await insertCategory(categoryName);
    setTimeout(() => {},0.01)
  }

  console.log('Finished loading categories.');
  await pool.end(); // Close the pool connection after the loop completes
}

loadCategories();