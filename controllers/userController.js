import User from '../models/userModel.js';
import generateToken from '../utils/generateToken.js';
import asyncHandler from 'express-async-handler';

// @desc    Register a new user
// @route   POST /api/users/signup
// @access  Public
const registerUser = asyncHandler(async (req, res) => {
	const { firstname, lastname, email, password, remember = false } = req.body;

	const userExists = await User.findOne({ email });

	if (userExists) {
		res.status(400);
		throw new Error('User already exists');
	}

	const user = await User.create({
		firstname,
		lastname,
		email,
		password,
	});

	if (user) {
		generateToken(res, user._id, remember);
		res.status(201).json({
			_id: user._id,
			firstname: user.firstname,
			lastname: user.lastname,
			email: user.email,
		});
	} else {
		res.status(400);
		throw new Error('Invalid user data');
	}
});

// @desc    Auth user & get token
// @route   POST /api/users/login
// @access  Public
const authUser = asyncHandler(async (req, res) => {
	const { email, password, remember } = req.body;

	const user = await User.findOne({ email });

	if (user && (await user.matchPassword(password))) {
		generateToken(res, user._id, remember);
		res.json({
			_id: user._id,
			firstname: user.firstname,
			lastname: user.lastname,
			email: user.email,
		});
	} else {
		res.status(401);
		if (user) {
			throw new Error('Invalid email or password');
		} else {
			throw new Error('This email is not registered, Would you like to register?');

		}
	}
});

// @desc    Get current user profile (Check Auth)
// @route   GET /api/users/profile
// @access  Private
const getUserProfile = asyncHandler(async (req, res) => {
	const user = {
		_id: req.user._id,
		name: req.user.name,
		email: req.user.email,
	};
	res.status(200).json(user);
});

// @desc    Logout user / clear cookie
// @route   POST /api/users/logout
// @access  Public
const logoutUser = asyncHandler(async (_req, res) => {
	res.cookie('jwt', '', {
		httpOnly: true,
		expires: new Date(0), // حذف الكوكيز فوراً
	});
	res.status(200).json({ message: 'Logged out successfully' });
});

export { registerUser, authUser, getUserProfile, logoutUser };