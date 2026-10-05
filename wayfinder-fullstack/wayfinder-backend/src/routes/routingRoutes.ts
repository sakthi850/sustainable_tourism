import { Router } from 'express';
import { route } from '../controllers/routingController';
const router=Router();router.get('/',route);export default router;
