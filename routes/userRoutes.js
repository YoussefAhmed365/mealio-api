const express = require('express');
const router = express.Router();
const { registerUser, authUser, logoutUser } = require('../controllers/userController.js');

router.post('/', registerUser);
router.post('/login', authUser);
router.post('/logout', logoutUser);

module.exports = router;