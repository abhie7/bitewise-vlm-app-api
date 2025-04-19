import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { config } from '../config/config'
import { ApiResponse, AuthRequest, UserPayload } from '../types'
import { logger } from '../utils/logger'
import { userService } from '../services/UserService'
import { v4 as uuidv4 } from 'uuid'

class AuthController {
  /**
   * Generate JWT token for authentication
   * @private
   */
  private generateToken(user: UserPayload): string {
    const payload = {
      uuid: user.uuid,
      email: user.email,
      userName: user.userName || 'defaultUserName',
    }

    // @ts-ignore
    return jwt.sign(payload, config.jwtSecret, {
      expiresIn: config.jwtExpiresIn,
    })
  }

  /**
   * Register a new user
   */
  public register = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { email, password, userName } = req.body
      const normalizedEmail = email.toLowerCase().trim()

      logger.info(`Registration attempt for email: ${normalizedEmail}`)

      const existingUser = await userService.findByEmail(normalizedEmail)
      if (existingUser) {
        logger.warn(
          `Registration failed: Email already exists: ${normalizedEmail}`
        )
        res.status(400).json({
          success: false,
          message: 'User with this email already exists',
        })
        return
      }

      // Generate UUID for new user
      const uuid = uuidv4()

      const user = await userService.createUser({
        email: normalizedEmail,
        uuid,
        userName,
        password,
      })

      const token = this.generateToken({
        uuid: user.uuid,
        email: user.email,
        userName: user.userName || 'defaultUserName',
      })

      logger.info(
        `User registered successfully: ${user._id} (${normalizedEmail})`
      )

      const response: ApiResponse<any> = {
        success: true,
        message: 'User registered successfully',
        data: {
          uuid: user.uuid,
          email: user.email,
          userName: user.userName,
          token,
        },
      }

      res.status(201).json(response)
    } catch (error) {
      logger.error('Registration error:', error)
      next(error)
    }
  }

  /**
   * User login
   */
  public login = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { email, password } = req.body
      const normalizedEmail = email.toLowerCase().trim()

      logger.info(`Login attempt for email: ${normalizedEmail}`)

      const user = await userService.findByEmail(normalizedEmail)

      if (!user) {
        logger.warn(
          `Login failed: User not found for email: ${normalizedEmail}`
        )
        res.status(401).json({
          success: false,
          message: 'Invalid credentials',
        })
        return
      }

      logger.debug(`User found:`, {
        uuid: user.uuid,
        email: user.email,
        hasPassword: !!user.password,
      })

      // If user.password is empty, we likely got a user document without the password field
      // Try to find it again with password field selected explicitly
      let userForAuth = user
      if (!user.password) {
        const userWithPassword = await userService.findByUuid(user.uuid)

        if (!userWithPassword || !userWithPassword.password) {
          logger.warn(
            `Login failed: Password field unavailable for user: ${normalizedEmail}`
          )
          res.status(401).json({
            success: false,
            message: 'Invalid credentials',
          })
          return
        }

        userForAuth = userWithPassword
      }

      const isMatch = await userService.comparePassword(
        password,
        userForAuth.password
      )
      if (!isMatch) {
        logger.warn(
          `Login failed: Password mismatch for user: ${normalizedEmail}`
        )
        res.status(401).json({
          success: false,
          message: 'Invalid credentials',
        })
        return
      }

      const token = this.generateToken({
        uuid: user.uuid,
        email: user.email,
        userName: user.userName,
      })

      logger.info(`Login successful: ${user._id} (${normalizedEmail})`)

      const response: ApiResponse<any> = {
        success: true,
        message: 'Login successful',
        data: {
          id: user._id,
          uuid: user.uuid,
          email: user.email,
          userName: user.userName,
          token,
        },
      }

      res.status(200).json(response)
    } catch (error) {
      logger.error('Login error:', error)
      next(error)
    }
  }

  /**
   * Reset user password
   */
  public resetPassword = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { email, newPassword } = req.body

      const user = await userService.findByEmail(email)
      if (!user) {
        res.status(404).json({
          success: false,
          message: 'User not found',
        })
        return
      }

      await userService.updateUser(user._id.toString(), {
        password: newPassword,
      })

      const response: ApiResponse<null> = {
        success: true,
        message: 'Password reset successful',
      }

      res.status(200).json(response)
    } catch (error) {
      logger.error('Password reset error:', error)
      next(error)
    }
  }

  /**
   * Get current user information
   */
  public getCurrentUser = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user?.uuid) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        })
        return
      }

      const user = await userService.findByUuid(req.user.uuid)
      if (!user) {
        res.status(404).json({
          success: false,
          message: 'User not found',
        })
        return
      }

      const response: ApiResponse<any> = {
        success: true,
        message: 'User retrieved successfully',
        data: {
          id: user._id,
          email: user.email,
          userName: user.userName,
        },
      }

      res.status(200).json(response)
    } catch (error) {
      logger.error('Get current user error:', error)
      next(error)
    }
  }
}

export const authController = new AuthController()
