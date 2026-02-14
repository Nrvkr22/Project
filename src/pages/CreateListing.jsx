import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { createItem, getItem, updateItem } from '../services/items';
import { uploadMultipleImages } from '../services/cloudinary';
import { categories, conditions, exchangeTypes, indianCities } from '../utils/constants';
import './CreateListing.css';

const CreateListing = () => {
    const { itemId } = useParams();
    const isEditing = Boolean(itemId);
    const navigate = useNavigate();
    const { user, userProfile } = useAuth();

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        price: '',
        condition: '',
        category: '',
        location: userProfile?.location || '',
        exchangeType: 'open_to_exchange',
    });
    const [images, setImages] = useState([]);
    const [imagePreviews, setImagePreviews] = useState([]);
    const [existingImages, setExistingImages] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [uploadProgress, setUploadProgress] = useState(0);

    useEffect(() => {
        if (isEditing) {
            fetchItemData();
        }
    }, [itemId]);

    const fetchItemData = async () => {
        try {
            const item = await getItem(itemId);
            if (item && item.userId === user.uid) {
                setFormData({
                    title: item.title,
                    description: item.description,
                    price: item.price.toString(),
                    condition: item.condition,
                    category: item.category,
                    location: item.location,
                    exchangeType: item.exchangeType,
                });
                setExistingImages(item.images || []);
            } else {
                navigate('/dashboard');
            }
        } catch (err) {
            console.error('Error fetching item:', err);
            navigate('/dashboard');
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleImageChange = (e) => {
        const files = Array.from(e.target.files);
        const maxImages = 5 - existingImages.length - images.length;

        if (files.length > maxImages) {
            setError(`You can only upload ${maxImages} more image(s)`);
            return;
        }

        // Validate file types and sizes
        const validFiles = files.filter((file) => {
            if (!file.type.startsWith('image/')) {
                setError('Only image files are allowed');
                return false;
            }
            if (file.size > 5 * 1024 * 1024) {
                setError('Each image must be less than 5MB');
                return false;
            }
            return true;
        });

        // Append to existing selections instead of replacing
        setImages((prev) => [...prev, ...validFiles]);

        // Create previews and append
        const previews = validFiles.map((file) => URL.createObjectURL(file));
        setImagePreviews((prev) => [...prev, ...previews]);
        setError('');

        // Reset file input so the same file can be re-selected
        e.target.value = '';
    };

    const removeImage = (index, isExisting = false) => {
        if (isExisting) {
            setExistingImages((prev) => prev.filter((_, i) => i !== index));
        } else {
            setImages((prev) => prev.filter((_, i) => i !== index));
            setImagePreviews((prev) => prev.filter((_, i) => i !== index));
        }
    };

    const validateForm = () => {
        if (!formData.title.trim()) {
            setError('Title is required');
            return false;
        }
        if (!formData.description.trim()) {
            setError('Description is required');
            return false;
        }
        if (!formData.price || parseFloat(formData.price) <= 0) {
            setError('Please enter a valid price');
            return false;
        }
        if (!formData.condition) {
            setError('Please select item condition');
            return false;
        }
        if (!formData.category) {
            setError('Please select a category');
            return false;
        }
        if (!formData.location) {
            setError('Please select your location');
            return false;
        }
        if (!isEditing && images.length === 0 && existingImages.length === 0) {
            setError('Please add at least one image');
            return false;
        }
        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!validateForm()) return;

        setLoading(true);
        setUploadProgress(0);

        try {
            let imageUrls = [...existingImages];

            // Upload new images
            if (images.length > 0) {
                setUploadProgress(20);
                const uploadedImages = await uploadMultipleImages(images);
                imageUrls = [...imageUrls, ...uploadedImages.map((img) => img.url)];
                setUploadProgress(60);
            }

            const itemData = {
                ...formData,
                price: parseFloat(formData.price),
                images: imageUrls,
            };

            setUploadProgress(80);

            if (isEditing) {
                await updateItem(itemId, itemData);
            } else {
                await createItem(itemData, user.uid);
            }

            setUploadProgress(100);
            navigate('/dashboard');
        } catch (err) {
            console.error('Error saving item:', err);
            setError('Failed to save item. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="create-listing-page page">
            <div className="page-header">
                <h1>{isEditing ? 'Edit Listing' : 'Create New Listing'}</h1>
                <p>{isEditing ? 'Update your item details' : 'Add details about the item you want to sell or exchange'}</p>
            </div>

            <div className="create-listing-content">
                <form onSubmit={handleSubmit} className="listing-form">
                    {error && <div className="form-error">{error}</div>}

                    {/* Images Section */}
                    <div className="form-section">
                        <h3>📸 Photos</h3>
                        <p className="section-hint">Add up to 5 photos. The first photo will be the cover.</p>

                        <div className="image-upload-area">
                            <div className="image-previews">
                                {existingImages.map((url, index) => (
                                    <div key={`existing-${index}`} className="image-preview">
                                        <img src={url} alt={`Item ${index + 1}`} />
                                        <button
                                            type="button"
                                            className="remove-image"
                                            onClick={() => removeImage(index, true)}
                                        >
                                            ×
                                        </button>
                                    </div>
                                ))}
                                {imagePreviews.map((preview, index) => (
                                    <div key={`new-${index}`} className="image-preview">
                                        <img src={preview} alt={`New ${index + 1}`} />
                                        <button
                                            type="button"
                                            className="remove-image"
                                            onClick={() => removeImage(index)}
                                        >
                                            ×
                                        </button>
                                    </div>
                                ))}
                                {existingImages.length + images.length < 5 && (
                                    <label className="image-upload-btn">
                                        <input
                                            type="file"
                                            accept="image/*"
                                            multiple
                                            onChange={handleImageChange}
                                            hidden
                                        />
                                        <span className="upload-icon">+</span>
                                        <span>Add Photo</span>
                                    </label>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Basic Info */}
                    <div className="form-section">
                        <h3>📝 Basic Info</h3>

                        <div className="form-group">
                            <label htmlFor="title">Title *</label>
                            <input
                                type="text"
                                id="title"
                                name="title"
                                value={formData.title}
                                onChange={handleChange}
                                placeholder="What are you selling?"
                                maxLength={100}
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="description">Description *</label>
                            <textarea
                                id="description"
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                placeholder="Describe your item in detail. Include condition, features, and any defects."
                                rows={5}
                                maxLength={2000}
                            />
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label htmlFor="category">Category *</label>
                                <select
                                    id="category"
                                    name="category"
                                    value={formData.category}
                                    onChange={handleChange}
                                >
                                    <option value="">Select category</option>
                                    {categories.map((cat) => (
                                        <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group">
                                <label htmlFor="condition">Condition *</label>
                                <select
                                    id="condition"
                                    name="condition"
                                    value={formData.condition}
                                    onChange={handleChange}
                                >
                                    <option value="">Select condition</option>
                                    {conditions.map((cond) => (
                                        <option key={cond} value={cond}>{cond}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Pricing */}
                    <div className="form-section">
                        <h3>💰 Pricing & Exchange</h3>

                        <div className="form-row">
                            <div className="form-group">
                                <label htmlFor="price">Price (₹) *</label>
                                <input
                                    type="number"
                                    id="price"
                                    name="price"
                                    value={formData.price}
                                    onChange={handleChange}
                                    placeholder="0"
                                    min="0"
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="exchangeType">Exchange Preference *</label>
                                <select
                                    id="exchangeType"
                                    name="exchangeType"
                                    value={formData.exchangeType}
                                    onChange={handleChange}
                                >
                                    {exchangeTypes.map((type) => (
                                        <option key={type.value} value={type.value}>{type.label}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Location */}
                    <div className="form-section">
                        <h3>📍 Location</h3>

                        <div className="form-group">
                            <label htmlFor="location">City *</label>
                            <select
                                id="location"
                                name="location"
                                value={formData.location}
                                onChange={handleChange}
                            >
                                <option value="">Select city</option>
                                {indianCities.map((city) => (
                                    <option key={city} value={city}>{city}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Progress Bar */}
                    {loading && uploadProgress > 0 && (
                        <div className="upload-progress">
                            <div className="progress-bar">
                                <div
                                    className="progress-fill"
                                    style={{ width: `${uploadProgress}%` }}
                                ></div>
                            </div>
                            <span>{uploadProgress < 100 ? 'Uploading...' : 'Done!'}</span>
                        </div>
                    )}

                    <div className="form-actions">
                        <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={() => navigate(-1)}
                            disabled={loading}
                        >
                            Cancel
                        </button>
                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            {loading ? 'Saving...' : isEditing ? 'Update Listing' : 'Post Listing'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateListing;
