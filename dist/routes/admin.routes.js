"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middleware/auth.middleware");
const database_1 = require("../config/database");
const router = (0, express_1.Router)();
// Todas las rutas de admin requieren autenticación y rol admin
router.use(auth_middleware_1.authMiddleware, auth_middleware_1.adminMiddleware);
// GET /api/admin/stats
router.get('/stats', async (req, res) => {
    try {
        const [users] = await database_1.pool.execute('SELECT COUNT(*) as count FROM users');
        const [battles] = await database_1.pool.execute('SELECT COUNT(*) as count FROM battles');
        const [teams] = await database_1.pool.execute('SELECT COUNT(*) as count FROM teams');
        const [publicTeams] = await database_1.pool.execute('SELECT COUNT(*) as count FROM teams WHERE is_public = 1');
        res.json({
            totalUsers: users[0].count,
            totalBattles: battles[0].count,
            totalTeams: teams[0].count,
            publicTeams: publicTeams[0].count
        });
    }
    catch (error) {
        res.status(500).json({ message: 'Error al obtener estadísticas' });
    }
});
// GET /api/admin/users
router.get('/users', async (req, res) => {
    try {
        const [users] = await database_1.pool.execute('SELECT id, username, email, role, avatar, created_at FROM users ORDER BY created_at DESC');
        res.json(users);
    }
    catch (error) {
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
        await database_1.pool.execute('UPDATE users SET role = ? WHERE id = ?', [role, id]);
        res.json({ message: 'Rol actualizado' });
    }
    catch (error) {
        res.status(500).json({ message: 'Error al actualizar usuario' });
    }
});
// DELETE /api/admin/users/:id
router.delete('/users/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await database_1.pool.execute('DELETE FROM users WHERE id = ?', [id]);
        res.json({ message: 'Usuario eliminado' });
    }
    catch (error) {
        res.status(500).json({ message: 'Error al eliminar usuario' });
    }
});
// GET /api/admin/teams
router.get('/teams', async (req, res) => {
    try {
        const [teams] = await database_1.pool.execute(`
      SELECT t.*, u.username as owner_username
      FROM teams t
      LEFT JOIN users u ON t.owner_id = u.id
      WHERE t.is_public = 1
      ORDER BY t.created_at DESC
    `);
        res.json(teams);
    }
    catch (error) {
        res.status(500).json({ message: 'Error al obtener equipos' });
    }
});
exports.default = router;
//# sourceMappingURL=admin.routes.js.map