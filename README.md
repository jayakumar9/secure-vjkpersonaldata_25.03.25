# Secure Personal Data Manager

A secure web application built with the MERN stack (MongoDB, Express.js, React, Node.js) for managing personal account credentials with enhanced features like file attachments and automatic logo fetching.

## Key Features

* 🔐 Secure user authentication with JWT
* 📊 Dashboard for managing test accounts
* 🎨 Modern UI with Tailwind CSS
* 🖼️ Enhanced website logo management:
  * Custom logo upload support
  * Automatic logo fetching from multiple sources
  * Fallback options for unavailable logos
* 📎 File attachment support with size limits
* 🔍 Real-time search functionality
* 📱 Responsive design
* ⚡ Pagination for better performance
* 🛡️ Protected API routes

## Tech Stack

### Frontend
* React.js
* Tailwind CSS
* Context API for state management
* Responsive components

### Backend
* Node.js
* Express.js
* MongoDB with Mongoose
* JWT Authentication
* File handling middleware

## Project Structure

```
secure-vjkpersonaldata/
├── backend/
│   ├── config/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   └── server.js
├── frontend/
│   ├── public/
│   └── src/
│       ├── components/
│       ├── contexts/
│       ├── test/
│       └── App.js
└── README.md
```

## Features in Detail

### Account Management
* Create, read, update, and delete test accounts
* Automatic serial number generation
* File attachments with size validation
* Rich text notes support

### Logo System
* Custom logo upload capability
* Multiple logo fetching sources:
  * Direct website favicons
  * Google's favicon service
  * DuckDuckGo icons
  * Clearbit logo API
* Fallback mechanisms for failed logo fetches
* Logo preview in forms

### Security Features
* JWT-based authentication
* Protected API routes
* File size validation
* Content type verification
* Rate limiting

### User Interface
* Clean, modern design
* Responsive layout
* Real-time search
* Pagination controls
* Success/error notifications
* Loading states
* Modal forms for add/edit

## Installation

1. Clone the repository:
```bash
git clone https://github.com/jayakumar9/secure-vjkpersonaldata_25.03.25.git
cd secure-vjkpersonaldata_25.03.25
```

2. Install dependencies:
```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

3. Set up environment variables:
Create `.env` file in the backend directory:
```env
PORT=5000
MONGODB_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
```

4. Start the application:
```bash
# Start backend server
cd backend
npm start

# Start frontend in a new terminal
cd frontend
npm start
```

## API Endpoints

### Authentication
* POST `/api/auth/register` - Register new user
* POST `/api/auth/login` - Login user

### Test Accounts
* GET `/api/test/accounts` - Get paginated accounts
* POST `/api/test/account` - Create new account
* PUT `/api/test/account/:id` - Update account
* DELETE `/api/test/account/:id` - Delete account

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/YourFeature`)
3. Commit your changes (`git commit -m 'Add YourFeature'`)
4. Push to the branch (`git push origin feature/YourFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.

## Acknowledgments

* MongoDB Atlas for database hosting
* Tailwind CSS for styling
* Various logo API providers 