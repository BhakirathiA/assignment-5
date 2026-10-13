import { Router } from 'express';
import { cpuRouter } from './cpu.route';
import { tasksRouter } from './task.route';

const router = Router();

router.use('/cpu', cpuRouter);
router.use('/tasks', tasksRouter);

export default router;