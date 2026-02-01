import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { getItems, searchItems } from '../services/items';
import { categories, conditions, indianCities } from '../utils/constants';
import { formatPrice, formatDate } from '../utils/helpers';
import './Browse.css';

const Browse = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
    const [filters, setFilters] = useState({
        category: searchParams.get('category') || 'All',
        condition: searchParams.get('condition') || '',
        location: searchParams.get('location') || '',
        minPrice: searchParams.get('minPrice') || '',
        maxPrice: searchParams.get('maxPrice') || '',
    });
    const [showFilters, setShowFilters] = useState(false);

    useEffect(() => {
        fetchItems();
    }, []);

    const fetchItems = async () => {
        setLoading(true);
        try {
            const { items: fetchedItems } = await getItems({ category: filters.category });
            setItems(fetchedItems);
        } catch (error) {
            console.error('Error fetching items:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (searchTerm.trim()) {
                const results = await searchItems(searchTerm, filters);
                setItems(results);
                setSearchParams({ search: searchTerm, ...filters });
            } else {
                const { items: fetchedItems } = await getItems(filters);
                setItems(fetchedItems);
                setSearchParams(filters);
            }
        } catch (error) {
            console.error('Search error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (key, value) => {
        setFilters((prev) => ({ ...prev, [key]: value }));
    };

    const applyFilters = async () => {
        setLoading(true);
        try {
            if (searchTerm.trim()) {
                const results = await searchItems(searchTerm, filters);
                setItems(results);
            } else {
                const { items: fetchedItems } = await getItems(filters);
                setItems(fetchedItems);
            }
            setShowFilters(false);
        } catch (error) {
            console.error('Filter error:', error);
        } finally {
            setLoading(false);
        }
    };

    const clearFilters = () => {
        setFilters({
            category: 'All',
            condition: '',
            location: '',
            minPrice: '',
            maxPrice: '',
        });
        setSearchTerm('');
        fetchItems();
        setSearchParams({});
    };

    return (
        <div className="browse-page page">
            <div className="browse-header">
                <div className="browse-header-content">
                    <h1>Browse Items</h1>
                    <p>Discover great deals and exchange opportunities</p>
                </div>

                <form className="search-bar" onSubmit={handleSearch}>
                    <input
                        type="text"
                        placeholder="Search for items..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <button type="submit" className="search-btn">
                        🔍 Search
                    </button>
                </form>
            </div>

            <div className="browse-content">
                <aside className={`filters-sidebar ${showFilters ? 'active' : ''}`}>
                    <div className="filters-header">
                        <h3>Filters</h3>
                        <button onClick={clearFilters} className="clear-filters-btn">
                            Clear All
                        </button>
                    </div>

                    <div className="filter-group">
                        <label>Category</label>
                        <select
                            value={filters.category}
                            onChange={(e) => handleFilterChange('category', e.target.value)}
                        >
                            <option value="All">All Categories</option>
                            {categories.map((cat) => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                    </div>

                    <div className="filter-group">
                        <label>Condition</label>
                        <select
                            value={filters.condition}
                            onChange={(e) => handleFilterChange('condition', e.target.value)}
                        >
                            <option value="">Any Condition</option>
                            {conditions.map((cond) => (
                                <option key={cond} value={cond}>{cond}</option>
                            ))}
                        </select>
                    </div>

                    <div className="filter-group">
                        <label>Location</label>
                        <select
                            value={filters.location}
                            onChange={(e) => handleFilterChange('location', e.target.value)}
                        >
                            <option value="">Any Location</option>
                            {indianCities.map((city) => (
                                <option key={city} value={city}>{city}</option>
                            ))}
                        </select>
                    </div>

                    <div className="filter-group">
                        <label>Price Range</label>
                        <div className="price-range">
                            <input
                                type="number"
                                placeholder="Min"
                                value={filters.minPrice}
                                onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                            />
                            <span>to</span>
                            <input
                                type="number"
                                placeholder="Max"
                                value={filters.maxPrice}
                                onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                            />
                        </div>
                    </div>

                    <button onClick={applyFilters} className="apply-filters-btn">
                        Apply Filters
                    </button>
                </aside>

                <main className="items-grid-container">
                    <div className="items-toolbar">
                        <span className="item-count">
                            {items.length} item{items.length !== 1 ? 's' : ''} found
                        </span>
                        <button
                            className="mobile-filter-btn"
                            onClick={() => setShowFilters(!showFilters)}
                        >
                            🎛️ Filters
                        </button>
                    </div>

                    {loading ? (
                        <div className="loading-container">
                            <div className="spinner"></div>
                            <p>Loading items...</p>
                        </div>
                    ) : items.length === 0 ? (
                        <div className="empty-state">
                            <span className="empty-icon">📦</span>
                            <h3>No items found</h3>
                            <p>Try adjusting your search or filters</p>
                            <button onClick={clearFilters} className="btn btn-primary">
                                Clear Filters
                            </button>
                        </div>
                    ) : (
                        <div className="items-grid">
                            {items.map((item) => (
                                <ItemCard key={item.id} item={item} />
                            ))}
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
};

const ItemCard = ({ item }) => {
    const mainImage = item.images?.[0] || 'https://via.placeholder.com/300x200?text=No+Image';

    return (
        <Link to={`/item/${item.id}`} className="item-card">
            <div className="item-image">
                <img src={mainImage} alt={item.title} loading="lazy" />
                {item.exchangeType !== 'sell_only' && (
                    <span className="exchange-badge">🔄 Exchange</span>
                )}
            </div>
            <div className="item-info">
                <h3 className="item-title">{item.title}</h3>
                <p className="item-price">{formatPrice(item.price)}</p>
                <div className="item-meta">
                    <span className="item-condition">{item.condition}</span>
                    <span className="item-location">📍 {item.location}</span>
                </div>
                <span className="item-date">{formatDate(item.createdAt)}</span>
            </div>
        </Link>
    );
};

export default Browse;
