import mongoose from 'mongoose';

// Exactly one of `recipient` (a direct message) or `team` (a team channel
// post) should be set - enforced in message.service.js rather than at the
// schema level, since Mongoose's conditional-required is awkward here.
const messageSchema = new mongoose.Schema(
  {
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', default: null },
    team: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', default: null },
    body: { type: String, required: true, trim: true },
    readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Employee' }],
  },
  { timestamps: true }
);

messageSchema.index({ sender: 1, recipient: 1, createdAt: -1 });
messageSchema.index({ team: 1, createdAt: -1 });

export const Message = mongoose.model('Message', messageSchema);
