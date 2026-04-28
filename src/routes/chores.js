import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import {
  createChore,
  getChores,
  getChore,
  updateChore,
  deleteChore,
} from '../controllers/chores.js';

// mergeParams lets us access :householdId from the parent router
const router = Router({ mergeParams: true });

router.use(authenticate);

router.post('/', createChore);
router.get('/', getChores);
router.get('/:id', getChore);
router.put('/:id', updateChore);
router.delete('/:id', deleteChore);

export default router;
