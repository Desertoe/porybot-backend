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
exports.createTeam = createTeam;
exports.getMyTeams = getMyTeams;
exports.getTeam = getTeam;
exports.updateTeam = updateTeam;
exports.deleteTeam = deleteTeam;
const teamService = __importStar(require("../services/team.service"));
async function createTeam(req, res) {
    try {
        const team = await teamService.createTeam(req.user.userId, req.user.role, req.body);
        res.status(201).json(team);
    }
    catch (err) {
        if (err.message === 'LIMIT_REACHED') {
            res.status(403).json({ message: 'Has alcanzado el límite de 3 equipos. Hazte premium para guardar equipos ilimitados.' });
            return;
        }
        if (err.message.startsWith('Equipo inválido')) {
            res.status(400).json({ message: err.message });
            return;
        }
        res.status(400).json({ message: err.message });
    }
}
async function getMyTeams(req, res) {
    try {
        res.json(await teamService.getUserTeams(req.user.userId, { type: req.query.type, regulation: req.query.regulation, species: req.query.species, search: req.query.search }));
    }
    catch (err) {
        res.status(400).json({ message: err.message });
    }
}
async function getTeam(req, res) {
    try {
        const team = await teamService.getTeamById(req.params.id, req.user?.userId);
        if (!team.is_public && team.owner_id !== req.user?.userId && req.user?.role !== 'admin') {
            res.status(403).json({ message: 'Forbidden' });
            return;
        }
        res.json(team);
    }
    catch (err) {
        res.status(404).json({ message: err.message });
    }
}
async function updateTeam(req, res) {
    try {
        res.json(await teamService.updateTeam(req.params.id, req.user.userId, req.body));
    }
    catch (err) {
        res.status(400).json({ message: err.message });
    }
}
async function deleteTeam(req, res) {
    try {
        await teamService.deleteTeam(req.params.id, req.user.userId);
        res.status(204).send();
    }
    catch (err) {
        res.status(400).json({ message: err.message });
    }
}
//# sourceMappingURL=team.controller.js.map