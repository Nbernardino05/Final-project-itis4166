import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import {
  createHousehold,
  getHouseholds,
  getHousehold,
  updateHousehold,
  deleteHousehold,
} from '../controllers/households.js';

const router = Router();

router.use(authenticate);

router.post('/', createHousehold);
router.get('/', getHouseholds);
router.get('/:id', getHousehold);
router.put('/:id', updateHousehold);
router.delete('/:id', deleteHousehold);

export default router;
