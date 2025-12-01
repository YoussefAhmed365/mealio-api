import jwt from 'jsonwebtoken';

const generateToken = (res, userId, remember) => {
	const token = jwt.sign({ userId }, process.env.JWT_SECRET, {
		expiresIn: remember ? '30d' : '1d',
	});

	res.cookie('jwt', token, {
		httpOnly: true, // Protect against XSS
		secure: process.env.NODE_ENV !== 'development',
		sameSite: 'strict', // Protect against CSRF
		maxAge: remember ? 30 * 24 * 60 * 60 * 1000 : 1 * 24 * 60 * 60 * 1000, // 30 days or 1 day
	});
};

export default generateToken;