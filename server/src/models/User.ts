import { Schema, model, type Model, type HydratedDocument } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser {
  name: string;
  email: string;
  password: string;
  role: 'user' | 'admin';
}

interface UserMethods {
  comparePassword(candidate: string): Promise<boolean>;
}

const userSchema = new Schema<IUser, Model<IUser, {}, UserMethods>, UserMethods>(
  {
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 60 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 8, select: false },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
  },
  { timestamps: true },
);

userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 12);
});

userSchema.methods.comparePassword = async function (candidate: string) {
  return bcrypt.compare(candidate, this.password);
};

export type UserDoc = HydratedDocument<IUser, UserMethods>;
export const User = model<IUser, Model<IUser, {}, UserMethods>>('User', userSchema);
