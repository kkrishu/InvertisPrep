import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { User } from '../models/User.js';

// Load environment variables
dotenv.config();

const SALT_ROUNDS = 10;

// Super admin data
const superAdmin = {
  email: 'superadmin@invertis.edu.in',
  password: 'super123',
  name: 'Super Admin',
  role: 'super-admin',
};

async function seedSuperAdmin() {
  try {
    const mongoURI = process.env.MONGODB_URI;
    if (!mongoURI) {
      throw new Error('MONGODB_URI is not defined in environment variables');
    }

    // Handle command line arguments for password
    const args = process.argv.slice(2);
    const passwordArg = args.find(arg => arg.startsWith('--password='));
    const newPassword = passwordArg ? passwordArg.split('=')[1] : superAdmin.password;

    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(mongoURI);
    console.log('✅ Connected to MongoDB\n');

    // Check if super admin exists
    const existing = await User.findOne({ email: superAdmin.email });
    
    if (existing) {
      console.log('👤 Super admin already exists. Updating password...');
      const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);
      existing.password = hashedPassword;
      existing.isActive = true;
      existing.lastLogin = new Date();
      await existing.save();
      console.log('✅ Password updated successfully\n');
    } else {
      // Create new super admin with hashed password
      console.log('👤 Creating super admin...');
      const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);

      await User.create({
        email: superAdmin.email,
        password: hashedPassword,
        name: superAdmin.name,
        role: superAdmin.role,
        isActive: true,
        lastLogin: new Date(),
      });
      console.log('✅ Super admin created\n');
    }

    // Print success message
    console.log('='.repeat(80));
    console.log('✅ SUPER ADMIN OPERATION SUCCESSFUL!');
    console.log(`   Email: ${superAdmin.email}`);
    console.log(`   Password: ${newPassword}`);
    console.log('='.repeat(80));
    console.log('\n📋 NEXT STEPS:');
    console.log('   1. Run: npm run dev');
    console.log('   2. Login to admin panel');
    console.log('   3. Create departments, branches, and sessions from admin panel');
    console.log('   4. Upload PYQ papers\n');
    console.log('='.repeat(80) + '\n');

  } catch (error) {
    console.error('❌ Error seeding super admin:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
}

// Run seeding
seedSuperAdmin();
