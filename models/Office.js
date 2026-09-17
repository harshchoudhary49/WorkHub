import mongoose from 'mongoose';

const officeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, unique: true },
    address: { type: String, trim: true, default: '' },
    timezone: { type: String, trim: true, default: 'Asia/Kolkata' },
  },
  { timestamps: true }
);

export const Office = mongoose.model('Office', officeSchema);
