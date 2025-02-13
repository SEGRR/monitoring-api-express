import multer from 'multer';

// Configure storage (store files in 'uploads/' directory)
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/'); // Store files in the 'uploads' directory
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname); // Unique filename
    }
});

// File filter (optional: restrict file types)
const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) { // Accept only images
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only images are allowed!'), false);
    }
};

// Multer upload middleware
const upload = multer({ storage, fileFilter });

export default upload;
