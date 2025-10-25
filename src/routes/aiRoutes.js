import express from 'express';
import { getSuggestions } from '../controllers/aiController.js';

const router = express.Router();

// @route   POST /api/ai/suggest
// @desc    Get AI-powered suggestions for charities
router.post('/suggest', getSuggestions);

export default router;