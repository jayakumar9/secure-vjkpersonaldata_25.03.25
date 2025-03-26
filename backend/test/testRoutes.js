const accountsTestRoute = require('./accountsTestRoute');

const setupTestRoutes = (app) => {
  console.log('Setting up test routes...');
  
  // Test routes
  app.use('/api/test', accountsTestRoute);
  
  console.log('Test routes setup complete');
};

module.exports = setupTestRoutes; 