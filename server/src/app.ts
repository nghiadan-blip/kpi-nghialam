import express, { Request, Response } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';
import departmentRoutes from './routes/departmentRoutes';
import taskRoutes from './routes/taskRoutes';
import catalogRoutes from './routes/catalogRoutes';
import evaluationRoutes from './routes/evaluationRoutes';
import reportRoutes from './routes/reportRoutes';
import aiRoutes from './routes/aiRoutes';
import jobPositionRoutes from './routes/jobPositionRoutes';
import budgetRoutes from './routes/budgetRoutes';
import publicInvestmentRoutes from './routes/publicInvestmentRoutes';
import landCertificateRoutes from './routes/landCertificateRoutes';
import officeRoutes from './routes/officeRoutes';
import executiveDashboardRoutes from './routes/executiveDashboardRoutes';
import projectRoutes from './routes/projectRoutes';

const app = express();

app.use(cors({
  origin: process.env.CLIENT_ORIGIN || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Healthcheck endpoint
app.get('/api/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'UP',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: 'SQLite (Knex)',
    version: '1.0.0'
  });
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/catalog', catalogRoutes);
app.use('/api/evaluations', evaluationRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/job-positions', jobPositionRoutes);
app.use('/api/budget', budgetRoutes);
app.use('/api/budgets', budgetRoutes);
app.use('/api/public-investment', publicInvestmentRoutes);
app.use('/api/investment', publicInvestmentRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/land-certificates', landCertificateRoutes);
app.use('/api/office', officeRoutes);
app.use('/api/executive-dashboard', executiveDashboardRoutes);

export default app;

