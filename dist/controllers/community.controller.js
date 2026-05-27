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
exports.getPublicTeams = getPublicTeams;
exports.toggleLike = toggleLike;
exports.saveTeam = saveTeam;
exports.getRankings = getRankings;
const communityService = __importStar(require("../services/community.service"));
async function getPublicTeams(req, res) {
    try {
        console.log('Auth header:', req.headers.authorization);
        console.log('userId from token:', req.user?.userId);
        res.json(await communityService.getPublicTeams(req.user?.userId, {
            regulation: req.query.regulation,
            species: req.query.species,
            search: req.query.search,
            sortBy: req.query.sortBy,
            page: req.query.page ? parseInt(req.query.page) : 1,
            limit: req.query.limit ? parseInt(req.query.limit) : 20
        }));
    }
    catch (err) {
        res.status(400).json({ message: err.message });
    }
}
async function toggleLike(req, res) {
    try {
        res.json({ liked: await communityService.toggleLike(req.user.userId, req.params.id) });
    }
    catch (err) {
        res.status(400).json({ message: err.message });
    }
}
async function saveTeam(req, res) {
    try {
        res.status(201).json(await communityService.savePublicTeam(req.user.userId, req.params.id));
    }
    catch (err) {
        res.status(400).json({ message: err.message });
    }
}
async function getRankings(req, res) {
    try {
        res.json(await communityService.getRankings());
    }
    catch (err) {
        res.status(400).json({ message: err.message });
    }
}
//# sourceMappingURL=community.controller.js.map