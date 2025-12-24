import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import {
    registerUser,
    authUser,
    getUserProfile,
    updateUserProfile,
    updateProfilePhoto,
    logoutUser
} from '../controllers/userController.js';
import { protect } from '../middleware/authMiddleware.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

const upload = multer({
    storage: multer.diskStorage({
        destination: (req, file, cb) => {
            cb(null, 'public/profiles/'); // Save to temp or directly, controller handles moving/renaming usually, but here we can just save to profiles and ensure unique names
        },
        filename: (req, file, cb) => {
             // We will handle the exact path in the controller or just let multer save a temp name
             // Actually, plan said save to public/profiles/{userId}. 
             // To do that in multer config, we need to create the dir.
             // Simpler: Upload to a temp dir 'public/temp' or just 'public/profiles' with unique name, then move/rename in controller.
             // OR: Use memory storage and write buffer in controller. 
             // Let's use diskStorage to 'public/profiles' with a temp name, or pass to controller.
             // The specific requirement: "public/profiles/{user._id}/UNIQUE_NAME.webp"
             // Since we need to ensure the dir exists, doing it in controller is safer/easier than dynamic multer destination config unless we use `fs` here.
             cb(null, file.fieldname + '-' + Date.now() + Math.round(Math.random() * 1E9) + path.extname(file.originalname));
        }
    })
});
// Correction: To keep it clean, I'll use memory storage or a simpler disk storage and let controller handle the logic of "public/profiles/{user._id}".
// Actually, `multer` default diskStorage without params saves to system temp.
// Let's stick to the plan: "Add upload.single('photo') middleware". 
// I will use memoryStorage so I can utilize `fs` in controller to write exactly where I want without worrying about cleanup of temp files or `mv`.
// PRO: easier to write file exactly where needed (and create dir).
// CON: Large files in memory. But profile photos are small (<5MB).

const memUpload = multer({ storage: multer.memoryStorage() });

router.post('/register', registerUser);
router.post('/login', authUser);
router.post('/logout', logoutUser);
router
    .route('/profile')
    .get(protect, getUserProfile)
    .put(protect, updateUserProfile);
router
    .route('/profile/photo')
    .put(protect, memUpload.single('photo'), updateProfilePhoto);

export default router;