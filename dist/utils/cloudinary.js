"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteFromCloudinary = exports.extractPublicId = exports.uploadToCloudinary = void 0;
const cloudinary_1 = require("cloudinary");
const stream_1 = require("stream");
cloudinary_1.v2.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'dshfshyhs',
    api_key: process.env.CLOUDINARY_API_KEY || '762454494361861',
    api_secret: process.env.CLOUDINARY_API_SECRET || 'LkFJb6nstGJOBoXzMBXAwZ8N458',
});
const uploadToCloudinary = async (file, folder = 'cafesystem') => {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary_1.v2.uploader.upload_stream({
            folder: folder,
            resource_type: 'image',
            transformation: [
                { width: 800, height: 800, crop: 'limit' },
                { quality: 'auto' },
            ],
        }, (error, result) => {
            if (error) {
                reject(error);
            }
            else if (result) {
                resolve({
                    secure_url: result.secure_url,
                    public_id: result.public_id,
                    width: result.width,
                    height: result.height,
                });
            }
            else {
                reject(new Error('Upload failed: No result returned'));
            }
        });
        const bufferStream = new stream_1.Readable();
        bufferStream.push(file.buffer);
        bufferStream.push(null);
        bufferStream.pipe(uploadStream);
    });
};
exports.uploadToCloudinary = uploadToCloudinary;
const extractPublicId = (url) => {
    try {
        const parts = url.split('/');
        const filename = parts[parts.length - 1];
        const publicId = filename.split('.')[0];
        const folderParts = parts.slice(parts.indexOf('upload') + 1, -1);
        if (folderParts.length > 0) {
            return `${folderParts.join('/')}/${publicId}`;
        }
        return publicId;
    }
    catch (error) {
        return null;
    }
};
exports.extractPublicId = extractPublicId;
const deleteFromCloudinary = async (url) => {
    try {
        const publicId = (0, exports.extractPublicId)(url);
        if (publicId) {
            await cloudinary_1.v2.uploader.destroy(publicId);
        }
    }
    catch (error) {
        console.error('Error deleting from Cloudinary:', error);
    }
};
exports.deleteFromCloudinary = deleteFromCloudinary;
exports.default = cloudinary_1.v2;
//# sourceMappingURL=cloudinary.js.map