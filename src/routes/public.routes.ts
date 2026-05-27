import { Router } from 'express';
import { pool } from '../config/database';

const router = Router();

router.get('/stats', async (req, res) => {
  try {
    const [users] = await pool.execute('SELECT COUNT(*) as count FROM users') as any;
    const [battles] = await pool.execute('SELECT COUNT(*) as count FROM battles') as any;
    const [teams] = await pool.execute('SELECT COUNT(*) as count FROM teams WHERE is_public = 1') as any;
    res.json({
      totalUsers: users[0].count,
      totalBattles: battles[0].count,
      totalTeams: teams[0].count,
    });
  } catch {
    res.status(500).json({ message: 'Error' });
  }
});

export default router;