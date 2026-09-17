import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import * as teamService from '../services/team.service.js';

export const list = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.department) filter.department = req.query.department;
  const teams = await teamService.listTeams(filter);
  return new ApiResponse(200, teams, 'Teams fetched').send(res);
});

export const getOne = asyncHandler(async (req, res) => {
  const team = await teamService.getTeamById(req.params.id);
  return new ApiResponse(200, team, 'Team fetched').send(res);
});

export const create = asyncHandler(async (req, res) => {
  const team = await teamService.createTeam(req.body);
  return new ApiResponse(201, team, 'Team created').send(res);
});

export const update = asyncHandler(async (req, res) => {
  const team = await teamService.updateTeam(req.params.id, req.body);
  return new ApiResponse(200, team, 'Team updated').send(res);
});

export const remove = asyncHandler(async (req, res) => {
  await teamService.deleteTeam(req.params.id);
  return new ApiResponse(200, null, 'Team deleted').send(res);
});
