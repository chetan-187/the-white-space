# The White Space - Real-time Collaborative Canvas

A real-time collaborative white canvas that allows multiple users to draw simultaneously in a shared workspace. Built with React, Node.js, and Redis for real-time synchronization.

## 🚀 Features

- Real-time collaborative canvas
- User presence indicators
- Shared workspace
- Responsive design


## 📋 Prerequisites

Before running this project, make sure you have the following installed:

- Node.js (v14 or higher)
- npm or yarn
- Redis (v6 or higher)

## 🛠️ Installation

1. Clone the repository:
```bash
git clone https://github.com/chetan-187/the-white-space.git
cd the-white-space
```

2. Install dependencies for both server and client:
```bash
# Install server dependencies
cd the-white-space-server
npm install

# Install client dependencies
cd ../the-white-space-web
npm install
```

3. Set up Redis:
- Make sure Redis server is installed and running on your machine
- Default Redis configuration uses:
  - Host: localhost
  - Port: 6379
  - No password (for local development)

## ⚙️ Configuration

1. Server Configuration:
```bash
cd the-white-space-server
# Create .env file with the following variables:
# PORT=8000
# REDIS_URL=redis://localhost:6379
```

2. Client Configuration:
```bash
cd the-white-space-web
# Create .env file with the following variables:
# REACT_APP_API_URL=http://localhost:8000
```

## 🚀 Running the Application

1. Start the server:
```bash
cd the-white-space-server
npm run dev
```

2. Start the client:
```bash
cd the-white-space-web
npm start
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend: http://localhost:8000

## 🔧 Redis Setup

This project requires Redis for real-time functionality. Here's how to set it up:

### macOS
```bash
# Using Homebrew
brew install redis
brew services start redis
```

### Linux
```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install redis-server
sudo systemctl start redis-server
```

### Windows
Download and install Redis from [Redis Windows Downloads](https://github.com/microsoftarchive/redis/releases)

### Verify Redis Installation
```bash
redis-cli ping
# Should return PONG
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.
