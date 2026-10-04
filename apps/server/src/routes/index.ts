import { Router } from 'express';
import { API_PREFIX } from '@cinelndex/shared';
import { moviesRouter } from './movie.routes.js';

/** /api/v1 下的所有资源路由集中在这里注册。 */
export const apiRouter: Router = Router();

apiRouter.use('/movies', moviesRouter);

export const API_BASE_PATH = API_PREFIX;
