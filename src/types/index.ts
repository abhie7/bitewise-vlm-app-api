import { Request } from 'express';
import { JwtPayload } from 'jsonwebtoken';
import { Document, Types } from 'mongoose';

export interface IUser extends Document {
  _id: Types.ObjectId;
  uuid: string;
  email: string;
  password: string;
  userName: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserPayload extends JwtPayload {
  uuid: string;
  email: string;
  userName: string;
}

export interface AuthRequest extends Request {
  user?: UserPayload;
}

export interface INutritionData extends Document {
  userId: string;
  imageUrl: string;
  foodName: string;
  calories: number;
  carbs: number;
  protein: number;
  fat: number;
  sugar: number;
  fiber: number;
  additionalInfo?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  error?: any;
}

export interface SocketEvents {
  connect: string;
  disconnect: string;
  error: string;
  nutritionAnalysisStart: string;
  nutritionAnalysisProgress: string;
  nutritionAnalysisComplete: string;
  nutritionAnalysisError: string;
}
