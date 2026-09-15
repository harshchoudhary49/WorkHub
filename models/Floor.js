import mongoose from 'mongoose';

const floorSchema = new mongoose.Schema(
  {
    office: { type: mongoose.Schema.Types.ObjectId, ref: 'Office', required: true },
    name: { type: String, required: true, trim: true }, // e.g. "Floor 2", "West Wing"
    floorNumber: { type: Number, default: 1 },
    // Grid dimensions the desk map renders against - kept simple (a grid,
    // not free-form pixels) so desk positions are just small integers an
    // HR admin can reason about without a drag-and-drop layout tool.
    gridWidth: { type: Number, default: 12, min: 1 },
    gridHeight: { type: Number, default: 8, min: 1 },
  },
  { timestamps: true }
);

floorSchema.index({ office: 1 });

export const Floor = mongoose.model('Floor', floorSchema);
