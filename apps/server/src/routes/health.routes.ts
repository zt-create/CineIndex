import { Router } from 'express';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { getHealth } from '../controllers/health.controller.js';

/** 健康检查不挂在 /api/v1 下，方便编排系统用固定路径探活。 */
export const healthRouter: Router = Router();

healthRouter.get('/health', asyncHandler(getHealth));
