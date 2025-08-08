import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/db';
import messageRoutes from './routes/messageRoutes';
import emailRoutes from './routes/emailRoutes';
import meetingRoutes from './routes/meetingRoutes';
import userRoutes from './routes/userRoutes';

// Load environment variables
dotenv.config();

const app = express();
// Fixed: Ensure PORT is a number
const PORT = Number(process.env.PORT) || 3000;

// Connect to database
connectDB();

// Updated CORS configuration for your frontend on port 5173
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:5173',           // Your actual frontend port
    'http://192.168.29.227:5173',      // Network IP if needed
    'http://127.0.0.1:5173',           // Alternative localhost
    process.env.FRONTEND_URL || 'http://localhost:5173'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Origin', 'Accept']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path} - Origin: ${req.get('Origin')}`);
  next();
});

// Routes
app.use('/api', messageRoutes);
app.use('/api', emailRoutes);
app.use('/api', meetingRoutes);
app.use('/api/users', userRoutes);

// Health check route
app.get('/health', (req, res) => {
  return res.status(200).json({ 
    message: 'Server is running', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    port: PORT,
    cors: {
      allowedOrigins: [
        'http://localhost:3000',
        'http://localhost:5173',
        'http://192.168.29.227:5173',
        process.env.FRONTEND_URL || 'http://localhost:5173'
      ]
    }
  });
});

// API status route
app.get('/api/status', (req, res) => {
  return res.status(200).json({
    success: true,
    message: 'API is working',
    endpoints: {
      messages: '/api/messages',
      users: '/api/users',
      emails: '/api/send-email/*',
      meetings: '/api/schedule-meeting'
    }
  });
});

// 404 handler
app.use('*', (req, res) => {
  return res.status(404).json({ 
    error: 'Route not found',
    path: req.originalUrl,
    availableRoutes: [
      'GET /health',
      'GET /api/status',
      'POST /api/messages',
      'GET /api/messages',
      'POST /api/users',
      'POST /api/send-email/send-ug-program-email',
      'POST /api/send-email/send-german-program-email',
      'POST /api/send-email/send-confirmation-email',
      'POST /api/schedule-meeting'
    ]
  });
});

// Global error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  return res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong',
    timestamp: new Date().toISOString()
  });
});

// Bind to all network interfaces for network access
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`🌐 Local: http://localhost:${PORT}`);
  console.log(`🌐 Network: http://192.168.29.227:${PORT}`);
  console.log(`📝 API Health: http://localhost:${PORT}/health`);
  console.log(`📊 API Status: http://localhost:${PORT}/api/status`);
  console.log(`✅ CORS enabled for frontend: http://localhost:5173`);
  console.log(`📧 Email service: ${process.env.EMAIL_SERVICE || 'gmail'}`);
  console.log(`🗄️  Database: ${process.env.MONGO_URI || 'mongodb://localhost:27017/payona-chatbot'}`);
});

export default app;
