// src/routes/index.ts
import { Router } from 'express';
import authRoutes from '../modules/auth/auth.routes';
import superAdminRoutes from '../modules/superAdmin/superAdmin.routes';
//import schoolRoutes from '../modules/schools/schools.routes';
//import userRoutes from '../modules/users/users.routes';
// ... other modules as you build them

const router = Router();

router.use('/auth', authRoutes);
router.use('/superAdmin', superAdminRoutes);
//router.use('/schools', schoolRoutes);
//router.use('/users', userRoutes);

export default router;