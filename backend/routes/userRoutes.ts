import express, { Request, Response, Router } from 'express';
import User from '../models/User';
import { IUser, ApiResponse } from '../types';

const router: Router = express.Router();

// GET all users
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const users: IUser[] = await User.find()
      .sort({ createdAt: -1 })
      .select('-__v');
    
    const response: ApiResponse<IUser[]> = {
      success: true,
      count: users.length,
      data: users
    };
    
    res.json(response);
    return; // Fixed: Explicit return
  } catch (error) {
    console.error('Error fetching users:', error);
    const response: ApiResponse = {
      success: false,
      error: 'Failed to fetch users'
    };
    res.status(500).json(response);
    return; // Fixed: Explicit return
  }
});

// POST create new user - Fixed return paths
router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const userData: Partial<IUser> = req.body;
    
    // Check if user already exists
    const existingUser: IUser | null = await User.findOne({ sessionEmail: userData.sessionEmail });
    if (existingUser) {
      // Update existing user
      const updatedUser: IUser | null = await User.findByIdAndUpdate(
        existingUser._id,
        userData,
        { new: true, runValidators: true }
      );
      
      const response: ApiResponse<IUser> = {
        success: true,
        message: 'User updated successfully',
        data: updatedUser!
      };
      
      res.json(response);
      return; // Fixed: Explicit return
    }
    
    // Create new user
    const user = new User(userData);
    const savedUser: IUser = await user.save();
    
    const response: ApiResponse<IUser> = {
      success: true,
      message: 'User created successfully',
      data: savedUser
    };
    
    res.status(201).json(response);
    return; // Fixed: Explicit return
  } catch (error: any) {
    console.error('Error saving user:', error);
    const response: ApiResponse = {
      success: false,
      error: error.message || 'Failed to save user'
    };
    res.status(500).json(response);
    return; // Fixed: Explicit return
  }
});

export default router;
