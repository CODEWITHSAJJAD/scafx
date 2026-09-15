import { Schema, model, type Document } from 'mongoose';

export interface IUser extends Document {
  email: string;
  name?: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
    name: { type: String, trim: true },
  },
  {
    timestamps: true,
  },
);

export const User = model<IUser>('User', UserSchema);
