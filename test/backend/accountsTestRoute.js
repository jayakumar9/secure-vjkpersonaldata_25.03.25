const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

// Test Account Schema
const TestAccountSchema = new mongoose.Schema({
  serialNumber: { type: Number, required: true, unique: true },
  website: { type: String, required: true },
  name: String,
  username: String,
  email: String,
  password: String,
  note: String,
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now }
});

const TestAccount = mongoose.model('TestAccount', TestAccountSchema);

// Helper function to generate test data
const generateTestData = async (count) => {
  const accounts = [];
  for (let i = 0; i < count; i++) {
    accounts.push({
      serialNumber: 1000 + i,
      website: `test-website-${i}.com`,
      name: `Test Account ${i}`,
      username: `testuser${i}`,
      email: `test${i}@example.com`,
      password: `password${i}`,
      note: `Test note for account ${i}`,
      user: new mongoose.Types.ObjectId()
    });
  }
  return TestAccount.insertMany(accounts);
};

// Route to initialize test data
router.post('/init', async (req, res) => {
  try {
    // Clear existing test data
    await TestAccount.deleteMany({});
    
    // Generate new test data (50 accounts)
    await generateTestData(50);
    
    res.json({ message: 'Test data initialized successfully' });
  } catch (error) {
    console.error('Error initializing test data:', error);
    res.status(500).json({ message: 'Error initializing test data' });
  }
});

// Route to get paginated accounts
router.get('/accounts', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Get total count for pagination
    const total = await TestAccount.countDocuments();

    // Get paginated accounts
    const accounts = await TestAccount.find()
      .sort({ serialNumber: 1 })
      .skip(skip)
      .limit(limit)
      .lean();

    res.json({
      accounts,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: limit,
        hasNextPage: skip + limit < total,
        hasPrevPage: page > 1
      }
    });
  } catch (error) {
    console.error('Error fetching test accounts:', error);
    res.status(500).json({ message: 'Error fetching test accounts' });
  }
});

module.exports = router; 