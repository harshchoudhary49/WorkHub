import mongoose from 'mongoose';

const recognitionSchema = new mongoose.Schema(
  {
    from: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
    to: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
    category: {
      type: String,
      enum: ['teamwork', 'leadership', 'innovation', 'helping', 'excellence'],
      required: true,
    },
    message: { type: String, trim: true, required: true },
  },
  { timestamps: true }
);

recognitionSchema.index({ to: 1, createdAt: -1 });

export const Recognition = mongoose.model('Recognition', recognitionSchema);
