import { Request, Response } from 'express';
import * as teamService from '../services/team.service';
import { TeamType } from '../types';

export async function createTeam(req: Request, res: Response): Promise<void> {
  try {
    const team = await teamService.createTeam(req.user!.userId, req.user!.role, req.body);
    res.status(201).json(team);
  } catch (err: any) {
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

export async function getMyTeams(req: Request, res: Response): Promise<void> {
  try { res.json(await teamService.getUserTeams(req.user!.userId, { type: req.query.type as TeamType, regulation: req.query.regulation as string, species: req.query.species as string, search: req.query.search as string })); }
  catch (err: any) { res.status(400).json({ message: err.message }); }
}

export async function getTeam(req: Request, res: Response): Promise<void> {
  try {
    const team = await teamService.getTeamById(req.params.id, req.user?.userId);
    if (!team.is_public && team.owner_id !== req.user?.userId && req.user?.role !== 'admin') { res.status(403).json({ message: 'Forbidden' }); return; }
    res.json(team);
  } catch (err: any) { res.status(404).json({ message: err.message }); }
}

export async function updateTeam(req: Request, res: Response): Promise<void> {
  try { res.json(await teamService.updateTeam(req.params.id, req.user!.userId, req.body)); }
  catch (err: any) { res.status(400).json({ message: err.message }); }
}

export async function deleteTeam(req: Request, res: Response): Promise<void> {
  try { await teamService.deleteTeam(req.params.id, req.user!.userId); res.status(204).send(); }
  catch (err: any) { res.status(400).json({ message: err.message }); }
}
