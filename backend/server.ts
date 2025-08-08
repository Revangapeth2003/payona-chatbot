import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/db'; // This import now works
import messageRoutes from './routes/messageRoutes';
import emailRoutes from './routes/emailRoutes';
import meetingRoutes from './routes/meetingRoutes';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Connect to database
connectDB();

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Routes
app.use('/api', messageRoutes);
app.use('/api', emailRoutes);
app.use('/api', meetingRoutes);

// Health check route
app.get('/health', (req, res) => {
  return res.status(200).json({ 
    message: 'Server is running', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// 404 handler
app.use('*', (req, res) => {
  return res.status(404).json({ 
    error: 'Route not found',
    path: req.originalUrl 
  });
});

// Global error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  return res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`📝 API Documentation: http://localhost:${PORT}/api`);
});

export default app;
