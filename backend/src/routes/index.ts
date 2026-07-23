// src/routes/index.ts
import { Router } from 'express';
import authRoutes from '../modules/auth/auth.routes';
import superAdminRoutes from '../modules/superAdmin/superAdmin.routes';
import adminRoutes from '../modules/user/admin/admin.routes';
import teacherRoutes from '../modules/user/staffs/teacher.routes';
import studentRoutes from '../modules/user/students/student.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/superAdmin', superAdminRoutes);
router.use('/admin', adminRoutes);
router.use('/teacher', teacherRoutes);
router.use('/student', studentRoutes);

export default router;