import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import * as announcementService from '../services/announcement.service.js';

export const create = asyncHandler(async (req, res) => {
  const announcement = await announcementService.createAnnouncement(req.user.id, req.body);
  return new ApiResponse(201, announcement, 'Announcement published').send(res);
});

export const listForMe = asyncHandler(async (req, res) => {
  const announcements = await announcementService.listAnnouncementsForMe(req.user.id);
  return new ApiResponse(200, announcements, 'Announcements fetched').send(res);
});

export const listAll = asyncHandler(async (req, res) => {
  const announcements = await announcementService.listAllAnnouncements();
  return new ApiResponse(200, announcements, 'Announcements fetched').send(res);
});

export const remove = asyncHandler(async (req, res) => {
  await announcementService.deleteAnnouncement(req.params.id);
  return new ApiResponse(200, null, 'Announcement deleted').send(res);
});
