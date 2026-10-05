import { Router } from 'express';
import { discover } from '../controllers/discoveryController';

const router = Router();
router.get('/', discover);
export default router;
