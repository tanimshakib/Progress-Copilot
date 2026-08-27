import { Router } from 'express';
import { authRequired } from '../../middlewares/auth';
import * as controller from './reports.controller';

const router = Router();

router.get('/summary', authRequired, controller.getReportSummary);
router.get('/productivity-score', authRequired, controller.getProductivityScore);
router.get('/download', authRequired, controller.downloadPDFReport);

export default router;
