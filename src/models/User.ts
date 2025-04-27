import mongoose, { Schema } from 'mongoose'
import { IUser } from '../types'

// Create schema for avatar data
const AvatarDataSchema = new Schema({
  bgColor: String,
  shapeColor: String,
  faceColor: String,
  transform: String,
  shapeType: String,
  rx: Schema.Types.Mixed, // Can be string or number
  faceType: String,
  eyeType: String,
  facePosition: String
}, { _id: false });

// Create schema for avatar
const AvatarSchema = new Schema({
  id: Number,
  avatarData: AvatarDataSchema
}, { _id: false });

const UserSchema: Schema = new Schema(
  {
    uuid: {
      type: String,
      required: true,
      unique: true,
      default: function () {
        const crypto = require('crypto')
        return crypto.randomUUID()
      },
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters long'],
      select: false,
    },
    userName: {
      type: String,
      trim: true,
    },
    avatar: {
      type: AvatarSchema,
      default: null
    }
  },
  {
    timestamps: true,
    toJSON: {
      transform: function (doc, ret) {
        delete ret.password
        return ret
      },
    },
  }
)


const User = mongoose.model<IUser>('User', UserSchema)

export default User
