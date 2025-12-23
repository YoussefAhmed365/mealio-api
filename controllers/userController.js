import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import User from '../models/userModel.js';
import generateToken from '../utils/generateToken.js';
import asyncHandler from 'express-async-handler';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
	if (!req.user) {
		res.status(401);
		throw new Error('User not found');
	}

	const user = {
		_id: req.user._id,
		firstname: req.user.firstname,
		lastname: req.user.lastname,
		email: req.user.email,
		profilePhoto: req.user.profilePhoto,
	};

	res.status(200).json(user);
});

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
const updateUserProfile = asyncHandler(async (req, res) => {
	const user = await User.findById(req.user._id);

	if (user) {
		user.firstname = req.body.firstname || user.firstname;
		user.lastname = req.body.lastname || user.lastname;
		user.email = req.body.email || user.email;

		if (req.body.password) {
			user.password = req.body.password;
		}

		const updatedUser = await user.save();

		res.status(200).json({
			_id: updatedUser._id,
			firstname: updatedUser.firstname,
			lastname: updatedUser.lastname,
			email: updatedUser.email,
		});
	} else {
		res.status(404);
		throw new Error('User not found');
	}
});

// @desc    Update user profile photo
// @route   PUT /api/users/profile/photo
// @access  Private
const updateProfilePhoto = asyncHandler(async (req, res) => {
	if (!req.file) {
		res.status(400);
		throw new Error('No file uploaded');
	}

	const user = await User.findById(req.user._id);

	if (user) {
		// Delete old photo if it exists and is not the default one
		if (
			user.profilePhoto &&
			!user.profilePhoto.includes('default.webp') &&
			user.profilePhoto.startsWith(`/profiles/${user._id}/`)
		) {
			const oldPhotoPath = path.join(
				__dirname,
				'../public',
				user.profilePhoto
			);
			if (fs.existsSync(oldPhotoPath)) {
				fs.unlinkSync(oldPhotoPath);
			}
		}

		user.profilePhoto = req.file.path;
		// Create directory if it doesn't exist
		// directory will be "public/profiles/{user._id}"
		const userDir = path.join(__dirname, `../public/profiles/${user._id}`);
		if (!fs.existsSync(userDir)) {
			fs.mkdirSync(userDir, { recursive: true });
		}

		// Generate unique filename
		const fileExt = path.extname(req.file.originalname);
		const fileName = `${req.file.filename || Date.now()}${fileExt}`; // Fallback if filename not set
		const filePath = path.join(userDir, fileName);

		// Move file (using renameSync as per user snippet, assuming req.file.path is a temp path)
		// Note: req.file.path comes from multer.
		fs.renameSync(req.file.path, filePath);

		user.profilePhoto = `/profiles/${user._id}/${fileName}`;
		const updatedUser = await user.save();

		res.status(200).json({
			_id: updatedUser._id,
			profilePhoto: updatedUser.profilePhoto,
		});
	} else {
		res.status(404);
		throw new Error('User not found');
	}
});

// @desc    Logout user / clear cookie
// @route   POST /api/users/logout
// @access  Public
const logoutUser = asyncHandler(async (_req, res) => {
	res.cookie('jwt', '', {
		httpOnly: true,
		expires: new Date(0), // حذف الكوكيز فوراً
	});
	res.status(200).json({ message: 'User logged out' });
});

export { registerUser, authUser, getUserProfile, updateUserProfile, updateProfilePhoto, logoutUser };