"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const database_1 = require("../config/database");
const router = (0, express_1.Router)();
router.get('/stats', async (req, res) => {
    try {
        const [users] = await database_1.pool.execute('SELECT COUNT(*) as count FROM users');
        const [battles] = await database_1.pool.execute('SELECT COUNT(*) as count FROM battles');
        const [teams] = await database_1.pool.execute('SELECT COUNT(*) as count FROM teams WHERE is_public = 1');
        res.json({
            totalUsers: users[0].count,
            totalBattles: battles[0].count,
            totalTeams: teams[0].count,
        });
    }
    catch {
        res.status(500).json({ message: 'Error' });
    }
});
exports.default = router;
//# sourceMappingURL=public.routes.js.map