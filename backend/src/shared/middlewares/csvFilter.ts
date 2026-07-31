import { Request } from 'express';
import multer, { FileFilterCallback } from 'multer';

export const csvFileFilter = (
    req: Request,
    file: Express.Multer.File,
    cb: FileFilterCallback
) => {
    const allowedMimes = ['text/csv', 'application/vnd.ms-excel', 'text/plain'];
    const isMimeOk = allowedMimes.includes(file.mimetype);

    const ext = file.originalname.split('.').pop()?.toLowerCase();
    const isExtOk = ext === 'csv';

    if (isMimeOk || isExtOk) {
        cb(null, true);   // accept
    } else {
        req.log.error('Invalid file type, only CSV files are accepted');
        // Pass null (not an Error) and false – satisfies the type check
        cb(null, false);  // reject without error
    }
};

export const upload = multer({
    storage: multer.memoryStorage(),
    fileFilter: csvFileFilter,
    limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
});