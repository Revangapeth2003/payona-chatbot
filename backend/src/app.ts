import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { connectDB } from './config/db';
import chatRoutes from './routes/chat.routes';

class App {
    public app: express.Application;

    constructor() {
        this.app = express();
        this.initializeDatabase();
        this.initializeMiddlewares();
        this.initializeRoutes();
    }

    private async initializeDatabase(): Promise<void> {
        await connectDB();
    }

    private initializeMiddlewares(): void {
        this.app.use(helmet());
        this.app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:3000" }));
        this.app.use(morgan('dev'));
        this.app.use(express.json());
    }

    private initializeRoutes(): void {
        this.app.use('/api', chatRoutes);
    }
}

export default new App().app;
