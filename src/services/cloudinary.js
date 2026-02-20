import imageCompression from 'browser-image-compression';

const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

export const uploadImage = async (file) => {
    // Compress image before upload
    const compressedFile = await imageCompression(file, {
        maxSizeMB: 5,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
    });

    const formData = new FormData();
    formData.append('file', compressedFile);
    formData.append('upload_preset', UPLOAD_PRESET);
    formData.append('folder', 'swapsphere');

    try {
        const response = await fetch(
            `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
            {
                method: 'POST',
                body: formData,
            }
        );

        if (!response.ok) {
            throw new Error('Upload failed');
        }

        const data = await response.json();
        return {
            url: data.secure_url,
            publicId: data.public_id,
        };
    } catch (error) {
        console.error('Cloudinary upload error:', error);
        throw error;
    }
};

export const uploadMultipleImages = async (files) => {
    const uploadPromises = Array.from(files).map((file) => uploadImage(file));
    return Promise.all(uploadPromises);
};

export const deleteImage = async (publicId) => {
    // Note: Deletion requires signed requests (backend)
    // For now, we'll just log it - deletion can be handled via Cloudinary dashboard
    console.log('Image deletion requested for:', publicId);
};
