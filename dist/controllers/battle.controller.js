"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.startBattle = startBattle;
exports.getBattles = getBattles;
exports.getBattle = getBattle;
exports.saveBattle = saveBattle;
exports.finishBattle = finishBattle;
exports.addTurn = addTurn;
exports.notifyBattleStarted = notifyBattleStarted;
exports.finishBattleByTag = finishBattleByTag;
exports.addTurnByTag = addTurnByTag;
const battleService = __importStar(require("../services/battle.service"));
const websocket_service_1 = require("../services/websocket.service");
const database_1 = require("../config/database");
const env_1 = require("../config/env");
async function startBattle(req, res) {
    try {
        const battle = await battleService.createBattle(req.user.userId, req.body.botTeamId || null);
        const [users] = await database_1.pool.execute('SELECT showdown_nick, username FROM users WHERE id = ?', [req.user.userId]);
        const user = users[0];
        const showdownNick = user?.showdown_nick || user?.username;
        let regulation = 'regg';
        let botTeamPaste = null;
        if (req.body.botTeamId) {
            const [teams] = await database_1.pool.execute('SELECT regulation, paste FROM teams WHERE id = ?', [req.body.botTeamId]);
            if (teams[0]?.regulation) {
                regulation = teams[0].regulation.toLowerCase().replace('reg ', 'reg').replace('.', '').replace('-', '').replace(' ', '');
                botTeamPaste = teams[0].paste || null;
            }
        }
        (0, websocket_service_1.registerPendingBattle)(req.user.userId, showdownNick);
        if ((0, websocket_service_1.isBotConnected)()) {
            (0, websocket_service_1.sendToBotSocket)({
                type: 'start_battle',
                battleId: battle.id,
                nick: showdownNick,
                regulation,
                botTeamId: req.body.botTeamId || null,
                paste: botTeamPaste
            });
            console.log(`[Bot] Challenge enviado a ${showdownNick} en formato ${regulation}`);
        }
        else {
            console.log('[Bot] No conectado — el usuario deberá enviar el challenge manualmente');
        }
        res.status(201).json({ ...battle, botConnected: (0, websocket_service_1.isBotConnected)() });
    }
    catch (err) {
        res.status(400).json({ message: err.message });
    }
}
async function getBattles(req, res) {
    try {
        res.json(await battleService.getUserBattles(req.user.userId, req.user.role));
    }
    catch (err) {
        res.status(400).json({ message: err.message });
    }
}
async function getBattle(req, res) {
    try {
        res.json(await battleService.getBattleDetail(req.params.id, req.user.userId));
    }
    catch (err) {
        res.status(404).json({ message: err.message });
    }
}
async function saveBattle(req, res) {
    try {
        await battleService.saveBattle(req.params.id, req.user.userId);
        res.json({ message: 'Battle saved' });
    }
    catch (err) {
        res.status(400).json({ message: err.message });
    }
}
async function finishBattle(req, res) {
    try {
        await battleService.finishBattle(req.params.id, req.body.result);
        res.json({ message: 'Battle updated' });
    }
    catch (err) {
        res.status(400).json({ message: err.message });
    }
}
async function addTurn(req, res) {
    try {
        await battleService.addBattleTurn(req.params.id, req.body.turnNum, req.body.logData, req.body.botReasoning);
        res.status(201).json({ message: 'Turn added' });
    }
    catch (err) {
        res.status(400).json({ message: err.message });
    }
}
async function notifyBattleStarted(req, res) {
    try {
        const botKey = req.headers['x-bot-key'];
        if (botKey !== env_1.env.jwt.secret) {
            res.status(403).json({ message: 'Unauthorized' });
            return;
        }
        const { userNick, battleTag } = req.body;
        const userId = (0, websocket_service_1.getUserByNick)(userNick);
        if (userId) {
            await database_1.pool.execute(`UPDATE battles SET showdown_id = ?, status = 'active' 
         WHERE user_id = ? ORDER BY played_at DESC LIMIT 1`, [battleTag, userId]);
            (0, websocket_service_1.notifyUser)(userId, 'battle:started', { battleTag });
            (0, websocket_service_1.clearPendingBattle)(userNick);
        }
        res.json({ message: 'ok' });
    }
    catch (err) {
        res.status(400).json({ message: err.message });
    }
}
async function finishBattleByTag(req, res) {
    try {
        const botKey = req.headers['x-bot-key'];
        if (botKey !== env_1.env.jwt.secret) {
            res.status(403).json({ message: 'Unauthorized' });
            return;
        }
        const { battleTag, result } = req.body;
        await database_1.pool.execute(`UPDATE battles SET result = ?, status = 'finished' WHERE showdown_id = ?`, [result, battleTag]);
        console.log(`[Bot] Combate ${battleTag} finalizado: ${result}`);
        res.json({ message: 'ok' });
    }
    catch (err) {
        res.status(400).json({ message: err.message });
    }
}
async function addTurnByTag(req, res) {
    try {
        const botKey = req.headers['x-bot-key'];
        if (botKey !== env_1.env.jwt.secret) {
            res.status(403).json({ message: 'Unauthorized' });
            return;
        }
        const { battleTag, turnNum, logData, botReasoning } = req.body;
        const [battles] = await database_1.pool.execute('SELECT id FROM battles WHERE showdown_id = ?', [battleTag]);
        if (battles[0]) {
            await battleService.addBattleTurn(battles[0].id, turnNum, logData, botReasoning);
        }
        res.json({ message: 'ok' });
    }
    catch (err) {
        res.status(400).json({ message: err.message });
    }
}
//# sourceMappingURL=battle.controller.js.map