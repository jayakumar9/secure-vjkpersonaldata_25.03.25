const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { protect } = require('../middleware/authMiddleware');

// Test Account Schema
const TestAccountSchema = new mongoose.Schema({
  serialNumber: { type: Number, required: true, unique: true },
  website: { type: String, required: true },
  name: String,
  username: String,
  email: String,
  password: String,
  note: String,
  logo: {
    type: {
      data: String,
      fileName: String,
      contentType: String,
      isCustom: Boolean
    },
    default: null
  },
  attachedFile: {
    fileName: String,
    data: String,
    contentType: String
  },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now }
});

// Helper function to get domain from website URL
const getDomain = (website) => {
  return website.toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/\/.*$/, '');
};

// Helper function to get first two letters for default logo
const getDefaultLogoText = (website) => {
  const domain = getDomain(website);
  return domain.substring(0, 2).toUpperCase();
};

// Helper function to get website logo
const getWebsiteLogo = (website) => {
  const domain = getDomain(website);
  
  // Special cases for known domains with reliable direct logo URLs
  const specialDomains = {
    'gmail.com': 'https://www.google.com/gmail/about/static/images/logo-gmail.png',
    'google.com': 'https://www.google.com/images/branding/googlelogo/2x/googlelogo_color_272x92dp.png',
    'youtube.com': 'https://www.youtube.com/s/desktop/12d6b690/img/favicon_144x144.png',
    'github.com': 'https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png',
    'yahoo.com': 'https://s.yimg.com/cv/apiv2/default/20201027/logo-new-yahoo.png'
  };

  // Array of logo URLs to try in sequence
  const logoUrls = {
    // Direct favicon URLs
    directFavicons: [
      `https://${domain}/favicon.ico`,
      `https://${domain}/favicon.png`,
      `https://${domain}/apple-touch-icon.png`,
      `https://${domain}/apple-touch-icon-precomposed.png`
    ],
    // API-based URLs
    apiUrls: [
      `https://logo.clearbit.com/${domain}`,
      `https://www.google.com/s2/favicons?domain=${domain}&sz=128`,
      `https://icons.duckduckgo.com/ip3/${domain}.ico`,
      `https://t2.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=${domain}&size=128`
    ]
  };

  // Return all possible URLs and default text
  return {
    specialUrl: specialDomains[domain] || null,
    directFavicons: logoUrls.directFavicons,
    apiUrls: logoUrls.apiUrls,
    defaultText: getDefaultLogoText(website)
  };
};

// Pre-save middleware to set logo
TestAccountSchema.pre('save', function(next) {
  if (this.isModified('website') && (!this.logo || !this.logo.isCustom)) {
    const logoData = getWebsiteLogo(this.website);
    this.logo = {
      data: logoData.specialUrl || logoData.apiUrls[0],
      fileName: `${getDomain(this.website)}_logo.png`,
      contentType: 'image/png',
      isCustom: false
    };
  }
  next();
});

const TestAccount = mongoose.model('TestAccount', TestAccountSchema);

// Helper function to generate test data
const generateTestData = async (userId) => {
  const accounts = [];
  for (let i = 0; i < 50; i++) {
    accounts.push({
      serialNumber: 1000 + i,
      website: `test-website-${i}.com`,
      name: `Test Account ${i}`,
      username: `testuser${i}`,
      email: `test${i}@example.com`,
      password: `password${i}`,
      note: `Test note for account ${i}`,
      user: userId
    });
  }
  return TestAccount.insertMany(accounts);
};

// Route to initialize test data
router.post('/init', protect, async (req, res) => {
  try {
    console.log('Initializing test data for user:', req.user.id);
    
    // Clear existing test data for this user
    await TestAccount.deleteMany({ user: req.user.id });
    
    // Generate new test data
    const accounts = await generateTestData(req.user.id);
    console.log(`Created ${accounts.length} test accounts`);
    
    res.json({ 
      success: true,
      message: 'Test data initialized successfully',
      count: accounts.length
    });
  } catch (error) {
    console.error('Error initializing test data:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error initializing test data',
      error: error.message
    });
  }
});

// Route to get paginated accounts with search
router.get('/accounts', protect, async (req, res) => {
  try {
    console.log('Fetching test accounts for user:', req.user.id);
    
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    const skip = (page - 1) * limit;

    // Build search query
    const searchQuery = {
      user: req.user.id,
      $or: [
        { website: { $regex: search, $options: 'i' } },
        { name: { $regex: search, $options: 'i' } },
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { note: { $regex: search, $options: 'i' } }
      ]
    };

    // Get total count for pagination
    const total = await TestAccount.countDocuments(searchQuery);
    console.log('Total accounts found:', total);

    // Get paginated accounts
    const accounts = await TestAccount.find(searchQuery)
      .sort({ serialNumber: 1 })
      .skip(skip)
      .limit(limit)
      .lean();

    console.log(`Returning ${accounts.length} accounts for page ${page}`);

    res.json({
      success: true,
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
    res.status(500).json({ 
      success: false,
      message: 'Error fetching test accounts',
      error: error.message
    });
  }
});

// Add account route
router.post('/account', protect, async (req, res) => {
  try {
    const { website, name, username, email, password, note, attachedFile, logo } = req.body;

    // Get next serial number
    const lastAccount = await TestAccount.findOne()
      .sort({ serialNumber: -1 })
      .lean();
    const serialNumber = lastAccount ? lastAccount.serialNumber + 1 : 1000;

    // Handle logo data
    let logoData = null;
    if (logo) {
      logoData = {
        ...logo,
        isCustom: true
      };
    } else {
      const defaultLogo = getWebsiteLogo(website);
      logoData = {
        data: defaultLogo.specialUrl || defaultLogo.apiUrls[0],
        fileName: `${getDomain(website)}_logo.png`,
        contentType: 'image/png',
        isCustom: false
      };
    }

    // Create new account
    const account = await TestAccount.create({
      serialNumber,
      website,
      name,
      username,
      email,
      password,
      note,
      attachedFile,
      logo: logoData,
      user: req.user.id
    });

    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      account
    });
  } catch (error) {
    console.error('Error creating test account:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating test account',
      error: error.message
    });
  }
});

// Update account route
router.put('/account/:id', protect, async (req, res) => {
  try {
    const { website, name, username, email, password, note, attachedFile, logo } = req.body;
    const account = await TestAccount.findOne({
      _id: req.params.id,
      user: req.user.id
    });

    if (!account) {
      return res.status(404).json({
        success: false,
        message: 'Account not found'
      });
    }

    // Handle logo update
    if (logo) {
      account.logo = {
        ...logo,
        isCustom: true
      };
    } else if (website && website !== account.website && (!account.logo || !account.logo.isCustom)) {
      const logoData = getWebsiteLogo(website);
      account.logo = {
        data: logoData.specialUrl || logoData.apiUrls[0],
        fileName: `${getDomain(website)}_logo.png`,
        contentType: 'image/png',
        isCustom: false
      };
    }

    account.website = website || account.website;
    account.name = name || account.name;
    account.username = username || account.username;
    account.email = email || account.email;
    account.password = password || account.password;
    account.note = note || account.note;
    
    // Only update attachedFile if a new one is provided
    if (attachedFile) {
      account.attachedFile = attachedFile;
    }

    await account.save();

    res.json({
      success: true,
      message: 'Account updated successfully',
      account
    });
  } catch (error) {
    console.error('Error updating test account:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating test account',
      error: error.message
    });
  }
});

// Delete account route
router.delete('/account/:id', protect, async (req, res) => {
  try {
    const account = await TestAccount.findOneAndDelete({
      _id: req.params.id,
      user: req.user.id
    });

    if (!account) {
      return res.status(404).json({
        success: false,
        message: 'Account not found'
      });
    }

    res.json({
      success: true,
      message: 'Account deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting test account:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting test account',
      error: error.message
    });
  }
});

// Get file route
router.get('/account/:id/file', protect, async (req, res) => {
  try {
    const account = await TestAccount.findOne({
      _id: req.params.id,
      user: req.user.id
    });

    if (!account || !account.attachedFile) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }

    res.json({
      success: true,
      file: account.attachedFile
    });
  } catch (error) {
    console.error('Error fetching file:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching file',
      error: error.message
    });
  }
});

module.exports = router; 