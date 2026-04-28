import express from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './swagger.js';
import authRoutes from './routes/auth.js';
import householdRoutes from './routes/households.js';
import choreRoutes from './routes/chores.js';
import expenseRoutes from './routes/expenses.js';

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use('/api/auth', authRoutes);
app.use('/api/households', householdRoutes);
app.use('/api/households/:householdId/chores', choreRoutes);
app.use('/api/households/:householdId/expenses', expenseRoutes);

app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

export default app;
