import { Request, Response } from 'express';
import * as communityService from '../services/community.service';

export async function getPublicTeams(req: Request, res: Response): Promise<void> {
  try {
    console.log('Auth header:', req.headers.authorization);
    console.log('userId from token:', req.user?.userId);
    res.json(await communityService.getPublicTeams(req.user?.userId, {
      regulation: req.query.regulation as string,
      species: req.query.species as string,
      search: req.query.search as string,
      sortBy: req.query.sortBy as any,
      page: req.query.page ? parseInt(req.query.page as string) : 1,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 20
    }));
  }
  catch (err: any) { res.status(400).json({ message: err.message }); }
}

export async function toggleLike(req: Request, res: Response): Promise<void> {
  try { res.json({ liked: await communityService.toggleLike(req.user!.userId, req.params.id) }); }
  catch (err: any) { res.status(400).json({ message: err.message }); }
}

export async function saveTeam(req: Request, res: Response): Promise<void> {
  try { res.status(201).json(await communityService.savePublicTeam(req.user!.userId, req.params.id)); }
  catch (err: any) { res.status(400).json({ message: err.message }); }
}

export async function getRankings(req: Request, res: Response): Promise<void> {
  try { res.json(await communityService.getRankings()); }
  catch (err: any) { res.status(400).json({ message: err.message }); }
}
