import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { faker } from '@faker-js/faker';

// Load env vars
// Make sure the path to your .env file is correct relative to the root
dotenv.config({ path: './.env' });

// Load models
import User from '../models/User.js';
import Listing from '../models/Listing.js';

// Connect to DB
mongoose.connect(process.env.DATABASE_URL);

// --- GENERATE MOCK DATA ---

const generateUsers = (count) => {
  const users = [];
  for (let i = 0; i < count; i++) {
    users.push({
      name: faker.person.fullName(),
      email: faker.internet.email().toLowerCase(),
      // All mock users will have the same password for easy testing
      password: 'password123', 
      role: faker.helpers.arrayElement(['donor', 'receiver']),
    });
  }
  return users;
};

const generateListings = (count, users) => {
  const listings = [];
  // Ensure we only create listings from users who are donors
  const donorUsers = users.filter(user => user.role === 'donor');

  if (donorUsers.length === 0) {
      console.log("No donors found to create listings. Please ensure some mock users have the 'donor' role.");
      return [];
  }

  for (let i = 0; i < count; i++) {
    // Assign a random donor's ID to the listing
    const randomDonor = faker.helpers.arrayElement(donorUsers);
    
    listings.push({
      title: faker.commerce.productName(),
      description: faker.lorem.sentence(),
      quantity: faker.number.int({ min: 1, max: 20 }), // Represents items or servings
      location: `${faker.location.streetAddress()}, ${faker.location.city()}`,
      donor: randomDonor._id,
      status: 'available',
    });
  }
  return listings;
};


// --- SCRIPT ACTIONS ---

// Import data into DB
const importData = async () => {
  try {
    // Clear existing data first
    await User.deleteMany();
    await Listing.deleteMany();
    console.log('Previous data destroyed...');

    // Create new users
    const createdUsers = await User.insertMany(generateUsers(15)); // Create 15 users
    console.log('15 mock users created...');

    // Create new listings linked to the donor users
    await Listing.insertMany(generateListings(30, createdUsers)); // Create 30 listings
    console.log('30 mock listings created...');

    console.log('✅ Mock Data Imported Successfully!');
    process.exit();
  } catch (err) {
    console.error(`Error: ${err.message}`);
    process.exit(1);
  }
};

// Delete data from DB
const deleteData = async () => {
  try {
    await User.deleteMany();
    await Listing.deleteMany();
    console.log('✅ Mock Data Destroyed Successfully!');
    process.exit();
  } catch (err) {
    console.error(`Error: ${err.message}`);
    process.exit(1);
  }
};

// Check for command-line arguments to run the correct function
if (process.argv[2] === '-i') {
  importData();
} else if (process.argv[2] === '-d') {
  deleteData();
} else {
    console.log("Please use '-i' to import data or '-d' to destroy data.");
    process.exit();
}