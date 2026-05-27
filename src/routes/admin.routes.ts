import { Router } from 'express';
import { authMiddleware, adminMiddleware } from '../middleware/auth.middleware';
import { pool } from '../config/database';

const router = Router();

// Todas las rutas de admin requieren autenticación y rol admin
router.use(authMiddleware, adminMiddleware);

// GET /api/admin/stats
router.get('/stats', async (req, res) => {
  try {
    const [users] = await pool.execute('SELECT COUNT(*) as count FROM users') as any;
    const [battles] = await pool.execute('SELECT COUNT(*) as count FROM battles') as any;
    const [teams] = await pool.execute('SELECT COUNT(*) as count FROM teams') as any;
    const [publicTeams] = await pool.execute('SELECT COUNT(*) as count FROM teams WHERE is_public = 1') as any;

    res.json({
      totalUsers: users[0].count,
      totalBattles: battles[0].count,
      totalTeams: teams[0].count,
      publicTeams: publicTeams[0].count
    });
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener estadísticas' });
  }
});

// GET /api/admin/users
router.get('/users', async (req, res) => {
  try {
    const [users] = await pool.execute(
    'SELECT id, username, email, role, avatar, created_at FROM users ORDER BY created_at DESC'
  ) as any;
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener usuarios' });
  }
});

// PATCH /api/admin/users/:id
router.patch('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;
    if (!['user', 'admin', 'premium'].includes(role)) {
      return res.status(400).json({ message: 'Rol inválido' });
    }
    await pool.execute('UPDATE users SET role = ? WHERE id = ?', [role, id]);
    res.json({ message: 'Rol actualizado' });
  } catch (error) {
    res.status(500).json({ message: 'Error al actualizar usuario' });
  }
});

// DELETE /api/admin/users/:id
router.delete('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.execute('DELETE FROM users WHERE id = ?', [id]);
    res.json({ message: 'Usuario eliminado' });
  } catch (error) {
    res.status(500).json({ message: 'Error al eliminar usuario' });
  }
});

// GET /api/admin/teams
router.get('/teams', async (req, res) => {
  try {
    const [teams] = await pool.execute(`
      SELECT t.*, u.username as owner_username
      FROM teams t
      LEFT JOIN users u ON t.owner_id = u.id
      WHERE t.is_public = 1
      ORDER BY t.created_at DESC
    `) as any;
    res.json(teams);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener equipos' });
  }
});

export default router;