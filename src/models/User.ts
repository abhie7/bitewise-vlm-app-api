import mongoose, { Schema } from 'mongoose'
import { IUser } from '../types'

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
