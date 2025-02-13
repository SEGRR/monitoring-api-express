import express from 'express';

const router = express.Router();

// Example Route
router.get('/', (req, res) => {
    res.send('Auth Route');
});

export default router;
