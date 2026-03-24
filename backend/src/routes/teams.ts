/**
 * Team Routes - REST API for AI Team management
 */

import { Router, Request, Response } from 'express';
import * as teamService from '../services/team.service';

const router = Router();

// POST /api/teams - Create a new team
router.post('/', (req: Request, res: Response) => {
  const { name, description, plan } = req.body;

  const result = teamService.createTeam({ name, description, plan });

  if (result.error) {
    return res.status(400).json({ error: result.error });
  }

  return res.status(201).json(result.team);
});

// GET /api/teams - List all teams
router.get('/', (_req: Request, res: Response) => {
  const result = teamService.listTeams();
  return res.status(200).json(result);
});

// GET /api/teams/:id - Get team details with members
router.get('/:id', (req: Request, res: Response) => {
  const { id } = req.params;

  const team = teamService.getTeamById(id);
  if (!team) {
    return res.status(404).json({ error: 'Team not found' });
  }

  return res.status(200).json(team);
});

// PUT /api/teams/:id - Update a team
router.put('/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, description, plan } = req.body;

  const result = teamService.updateTeam(id, { name, description, plan });

  if (result.error === 'Team not found') {
    return res.status(404).json({ error: result.error });
  }
  if (result.error) {
    return res.status(400).json({ error: result.error });
  }

  return res.status(200).json(result.team);
});

// DELETE /api/teams/:id - Delete a team
router.delete('/:id', (req: Request, res: Response) => {
  const { id } = req.params;

  const deleted = teamService.deleteTeam(id);
  if (!deleted) {
    return res.status(404).json({ error: 'Team not found' });
  }

  return res.status(204).send();
});

// POST /api/teams/:id/members - Add employee to team
router.post('/:id/members', (req: Request, res: Response) => {
  const { id } = req.params;
  const { employeeId, role } = req.body;

  const result = teamService.addMember(id, { employeeId, role });

  if (result.error === 'Team not found') {
    return res.status(404).json({ error: result.error });
  }
  if (result.error === 'Employee not found') {
    return res.status(404).json({ error: result.error });
  }
  if (result.error === 'Employee already in team') {
    return res.status(409).json({ error: result.error });
  }
  if (result.error) {
    return res.status(400).json({ error: result.error });
  }

  return res.status(201).json(result.result);
});

// DELETE /api/teams/:id/members/:employeeId - Remove employee from team
router.delete('/:id/members/:employeeId', (req: Request, res: Response) => {
  const { id, employeeId } = req.params;

  const result = teamService.removeMember(id, employeeId);

  if (result.error === 'Team not found') {
    return res.status(404).json({ error: result.error });
  }
  if (result.error === 'Employee not in team') {
    return res.status(404).json({ error: result.error });
  }

  return res.status(204).send();
});

export default router;
