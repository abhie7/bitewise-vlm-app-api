import { Document } from 'mongoose'
import { Request } from 'express'

// Avatar Data Interface
export interface IAvatarData {
  bgColor?: string;
  shapeColor?: string;
  faceColor?: string;
  transform?: string;
  shapeType?: string;
  rx?: string | number;
  faceType?: string;
  eyeType?: string;
  facePosition?: string;
}

// Avatar Interface
export interface IAvatar {
  id: number;
  avatarData?: IAvatarData;
}

// User Interface
export interface IUser extends Document {
  _id: any
  uuid: string
  email: string
  password: string
  userName?: string
  avatar?: IAvatar
  createdAt: Date
  updatedAt: Date
}

// User Payload Interface
export interface UserPayload {
  uuid: string
  email: string
  userName?: string
  avatar?: IAvatar
  id?: string
}

// Authentication Request Interface
export interface AuthRequest extends Request {
  user?: UserPayload
}

// API Response Interface
export interface ApiResponse<T> {
  success: boolean
  message: string
  data?: T
}