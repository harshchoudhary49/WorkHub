import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import * as messageService from '../services/message.service.js';

export const sendDirect = asyncHandler(async (req, res) => {
  const message = await messageService.sendDirectMessage(req.user.id, req.body);
  return new ApiResponse(201, message, 'Message sent').send(res);
});

export const conversation = asyncHandler(async (req, res) => {
  const messages = await messageService.getDirectConversation(req.user.id, req.params.employeeId);
  return new ApiResponse(200, messages, 'Conversation fetched').send(res);
});

export const inbox = asyncHandler(async (req, res) => {
  const contacts = await messageService.getInbox(req.user.id);
  return new ApiResponse(200, contacts, 'Inbox fetched').send(res);
});

export const sendTeam = asyncHandler(async (req, res) => {
  const message = await messageService.sendTeamMessage(req.user.id, req.params.teamId, req.body);
  return new ApiResponse(201, message, 'Message sent').send(res);
});

export const teamMessages = asyncHandler(async (req, res) => {
  const messages = await messageService.getTeamMessages(req.user.id, req.params.teamId);
  return new ApiResponse(200, messages, 'Team messages fetched').send(res);
});

export const myTeams = asyncHandler(async (req, res) => {
  const teams = await messageService.getMyTeams(req.user.id);
  return new ApiResponse(200, teams, 'Teams fetched').send(res);
});
