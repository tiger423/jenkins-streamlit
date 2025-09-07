# Jenkins Dashboard - Express.js + React

A modern web-based dashboard for managing Jenkins jobs and pipelines, built with Express.js backend and React frontend with Material-UI.

## 🚀 Features

- **Modern UI**: Professional Material-UI interface with sidebar + single column layout
- **Jenkins Integration**: Complete Jenkins API integration for job management
- **Real-time Operations**: Connect, test, list jobs, view details, server info, and debug info
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **Error Handling**: Comprehensive error handling with user-friendly messages
- **Job Management**: View job status, build history, and configuration details

## 📋 Prerequisites

Before running the application, ensure you have the following installed:

- **Node.js** (v16 or higher) - [Download here](https://nodejs.org/)
- **npm** (comes with Node.js)
- **Jenkins Server** - Accessible Jenkins instance with API enabled

## 🛠️ Installation & Setup

### 1. Clone the Repository

```bash
git clone https://github.com/tiger423/jenkins-streamlit.git
cd jenkins-streamlit/jenkins-express
```

### 2. Backend Setup (Express.js)

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Configure environment (optional)
# Edit .env file to customize settings
cp .env .env.local  # Create local copy if needed
```

### 3. Frontend Setup (React)

```bash
# Navigate to frontend directory (from jenkins-express root)
cd frontend

# Install dependencies
npm install

# Configure API endpoint (optional)
# Edit .env file to change backend URL if needed
```

## 🚀 Running the Application

### Development Mode (Recommended for testing)

**Option 1: Run both servers separately (recommended)**

1. **Start the Backend Server:**
   ```bash
   cd jenkins-express/backend
   npm run dev
   ```
   Backend will run on: http://localhost:3001

2. **Start the Frontend Development Server:**
   ```bash
   # In a new terminal
   cd jenkins-express/frontend
   npm run dev
   ```
   Frontend will run on: http://localhost:5173

3. **Access the Application:**
   Open your browser and go to: http://localhost:5173

**Option 2: Production mode (single server)**

1. **Build the Frontend:**
   ```bash
   cd jenkins-express/frontend
   npm run build
   ```

2. **Start the Backend (serves built frontend):**
   ```bash
   cd jenkins-express/backend
   npm start
   ```

3. **Access the Application:**
   Open your browser and go to: http://localhost:3001

## 📖 Usage Guide

### 1. Connect to Jenkins

1. **Enter Jenkins Server Details:**
   - **Server URL**: Your Jenkins server URL (e.g., `http://your-jenkins-server:8080`)
   - **Username**: Your Jenkins username
   - **Password**: Your Jenkins password or API token

2. **Click "Connect"** to establish connection

### 2. Available Operations

Once connected, you can perform the following operations:

- **🔍 Test Connection**: Verify your Jenkins connection is working
- **📋 List All Jobs**: View all available Jenkins jobs with status indicators
- **🔧 Get Job Details**: Select a job to view detailed information and build history
- **ℹ️ Server Info**: Display Jenkins server information and configuration
- **🐛 Debug Info**: Show debug information for troubleshooting

### 3. Job Status Indicators

- **🟢 SUCCESS**: Job completed successfully (blue in Jenkins)
- **🔴 FAILED**: Job failed (red in Jenkins)
- **🟡 UNSTABLE**: Job completed with warnings (yellow in Jenkins)
- **⚫ DISABLED**: Job is disabled (grey in Jenkins)
- **🔵 BUILDING**: Job is currently running

## ⚙️ Configuration

### Backend Configuration (.env)

```env
PORT=3001
NODE_ENV=development
JENKINS_TIMEOUT=30000
```

### Frontend Configuration (.env)

```env
VITE_API_BASE_URL=http://localhost:3001
```

## 🏗️ Project Structure

```
jenkins-express/
├── backend/                 # Express.js backend
│   ├── server.js           # Main server file
│   ├── jenkinsClient.js    # Jenkins API client
│   ├── package.json        # Backend dependencies
│   └── .env               # Backend configuration
├── frontend/               # React frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   │   ├── ConnectionPanel.tsx
│   │   │   ├── OperationsPanel.tsx
│   │   │   └── ResultsDisplay.tsx
│   │   ├── types.ts       # TypeScript type definitions
│   │   └── App.tsx        # Main application component
│   ├── package.json       # Frontend dependencies
│   └── .env              # Frontend configuration
└── .gitignore            # Git ignore rules
```

## 🔧 API Endpoints

The backend provides the following REST API endpoints:

- `POST /api/connect` - Connect to Jenkins server
- `POST /api/disconnect` - Disconnect from Jenkins
- `GET /api/test-connection` - Test current connection
- `GET /api/jobs` - List all Jenkins jobs
- `GET /api/jobs/:jobName` - Get specific job details
- `GET /api/jobs/:jobName/config` - Get job configuration
- `GET /api/server-info` - Get Jenkins server information
- `GET /api/debug-info` - Get debug information
- `GET /api/connection-status` - Check connection status

## 🐛 Troubleshooting

### Common Issues

1. **Connection Timeout**
   - Verify Jenkins server URL is correct and accessible
   - Check if Jenkins server is running
   - Ensure network connectivity

2. **Authentication Failed**
   - Verify username and password/API token
   - Check if user has necessary permissions
   - Try using API token instead of password

3. **CORS Issues**
   - Backend includes CORS middleware for development
   - For production, ensure proper CORS configuration

4. **Port Already in Use**
   - Change port in backend `.env` file
   - Update frontend `.env` to match new backend port

### Debug Mode

Enable debug logging by setting environment variable:
```bash
DEBUG=jenkins-dashboard npm run dev
```

## 🔒 Security Notes

- **Never commit credentials** to version control
- **Use API tokens** instead of passwords when possible
- **Configure HTTPS** for production deployments
- **Implement proper authentication** for production use

## 📝 Migration from Streamlit

This application replaces the previous Streamlit-based dashboard with:

- ✅ Modern React frontend with Material-UI
- ✅ RESTful Express.js backend
- ✅ Improved error handling and user experience
- ✅ Responsive design for all devices
- ✅ Professional UI with loading states and animations

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

If you encounter any issues or have questions:

1. Check the troubleshooting section above
2. Review the Jenkins server logs
3. Check browser developer console for frontend errors
4. Create an issue on GitHub with detailed error information

---

**Enjoy managing your Jenkins jobs with the modern dashboard! 🚀**
