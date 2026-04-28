import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import {
  createExpense,
  getExpenses,
  getExpense,
  updateExpense,
  deleteExpense,
} from '../controllers/expenses.js';

const router = Router({ mergeParams: true });

router.use(authenticate);

router.post('/', createExpense);
router.get('/', getExpenses);
router.get('/:id', getExpense);
router.put('/:id', updateExpense);
router.delete('/:id', deleteExpense);

export default router;
