import mongoose from 'mongoose';

const deskSchema = new mongoose.Schema(
  {
    floor: { type: mongoose.Schema.Types.ObjectId, ref: 'Floor', required: true },
    deskCode: { type: String, required: true, trim: true }, // e.g. "A1"
    position: {
      x: { type: Number, required: true, min: 0 },
      y: { type: Number, required: true, min: 0 },
    },
    assignedEmployee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      default: null,
    },
  },
  { timestamps: true }
);

deskSchema.index({ floor: 1, deskCode: 1 }, { unique: true });
deskSchema.index(
  { assignedEmployee: 1 },
  { unique: true, partialFilterExpression: { assignedEmployee: { $type: 'objectId' } } }
);

export const Desk = mongoose.model('Desk', deskSchema);
