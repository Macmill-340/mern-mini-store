import 'dotenv/config';
import { connectDb } from './config/db.js';
import { User } from './models/User.js';
import { Product } from './models/Product.js';
import { Order } from './models/Order.js';

if (process.env.NODE_ENV === 'production' && !process.argv.includes('--force')) {
  console.error('Refusing to seed in production. Use --force to override.');
  process.exit(1);
}

const products = [
  { name: 'Wireless Headphones', description: 'Noise-cancelling over-ear headphones with 30-hour battery life.', price: 2499, image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80', category: 'Electronics', stock: 15, featured: true },
  { name: 'Smart Watch', description: 'Fitness tracking smartwatch with heart-rate monitor and GPS.', price: 3999, image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80', category: 'Electronics', stock: 10, featured: true },
  { name: 'Running Sneakers', description: 'Lightweight running shoes with breathable mesh upper.', price: 1899, image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80', category: 'Apparel', stock: 20 },
  { name: 'DSLR Camera', description: '24MP DSLR camera with 18-55mm kit lens.', price: 45999, image: 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=800&q=80', category: 'Electronics', stock: 5 },
  { name: 'Sunglasses', description: 'Polarized UV400 sunglasses for everyday wear.', price: 899, image: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?auto=format&fit=crop&w=800&q=80', category: 'Accessories', stock: 30 },
  { name: 'Leather Backpack', description: 'Durable leather backpack with laptop compartment.', price: 2199, image: 'https://images.unsplash.com/photo-1560343090-f0409e92791a?auto=format&fit=crop&w=800&q=80', category: 'Accessories', stock: 12 },
  { name: 'Eau de Parfum', description: 'Long-lasting floral fragrance, 100ml.', price: 1499, image: 'https://images.unsplash.com/photo-1585386959984-a4155224a1ad?auto=format&fit=crop&w=800&q=80', category: 'Accessories', stock: 25 },
  { name: 'Cotton T-Shirt', description: 'Soft breathable cotton crew-neck t-shirt.', price: 499, image: 'https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&w=800&q=80', category: 'Apparel', stock: 50 },
  { name: 'Mechanical Keyboard', description: 'RGB mechanical keyboard with hot-swappable switches.', price: 3299, image: 'https://images.unsplash.com/photo-1606760227091-3dd870d97d1d?auto=format&fit=crop&w=800&q=80', category: 'Electronics', stock: 8 },
  { name: 'Wireless Mouse', description: 'Ergonomic wireless mouse with silent clicks.', price: 799, image: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=800&q=80', category: 'Electronics', stock: 40 },
  { name: 'High-Top Sneakers', description: 'Classic high-top sneakers in canvas.', price: 1599, image: 'https://images.unsplash.com/photo-1491553895911-0055eca6402d?auto=format&fit=crop&w=800&q=80', category: 'Apparel', stock: 18 },
  { name: 'Reading Glasses', description: 'Blue-light blocking reading glasses.', price: 699, image: 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=800&q=80', category: 'Accessories', stock: 22 },
  { name: 'Ultrabook Laptop', description: '14-inch ultrabook with 16GB RAM and 512GB SSD.', price: 69999, image: 'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?auto=format&fit=crop&w=800&q=80', category: 'Electronics', stock: 4, featured: true },
  { name: '3-Seater Sofa', description: 'Comfortable fabric 3-seater sofa for living room.', price: 24999, image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=800&q=80', category: 'Home', stock: 3 },
  { name: 'Table Lamp', description: 'Warm LED table lamp with adjustable brightness.', price: 1199, image: 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=800&q=80', category: 'Home', stock: 16 },
  { name: 'Ergonomic Chair', description: 'Adjustable ergonomic office chair with lumbar support.', price: 8999, image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80', category: 'Home', stock: 7 },
  { name: 'Paperback Novel', description: 'Bestselling fiction novel, paperback edition.', price: 399, image: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=800&q=80', category: 'Books', stock: 60 },
  { name: 'Programming Handbook', description: 'Comprehensive guide to modern web development.', price: 799, image: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=800&q=80', category: 'Books', stock: 35 },
];

async function main() {
  await connectDb();
  await Promise.all([User.deleteMany({}), Product.deleteMany({}), Order.deleteMany({})]);
  await User.create([
    { name: 'Admin', email: 'admin@store.test', password: 'Admin@12345', role: 'admin' },
    { name: 'Demo User', email: 'demo@store.test', password: 'Demo@12345', role: 'user' },
  ]);
  await Product.insertMany(products);
  console.log(`Seeded ${products.length} products and 2 users.`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
