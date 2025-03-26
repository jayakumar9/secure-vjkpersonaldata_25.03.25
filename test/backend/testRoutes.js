const express = require('express');
const mongoose = require('mongoose');
const accountsTestRoute = require('./accountsTestRoute');

const setupTestRoutes = (app) => {
  // Connect to test database
  mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/personal_data_test', {
    useNewUrlParser: true,
    useUnifiedTopology: true
  });

  // Test routes
  app.use('/api/test', accountsTestRoute);
};

module.exports = setupTestRoutes; 