'use client';

import { Input } from '@/components/ui/input';
import debounce from 'lodash.debounce';
import { Search, Clock, TrendingUp, PackageX, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import React, { useEffect, useRef, useState, useCallback, memo } from 'react';
import slugify from 'slugify';
import Fuse from 'fuse.js';
import Image from 'next/image';

interface SearchProduct {
  id: string;
  title: string;
  slug: string;
  price: number;
  image: string;
  brand: string;
  stock: number;
  tags: string[];
  medicineType: string;
}

interface ApiResponse {
  success: boolean;
  data: SearchProduct[];
}

const RECENT_SEARCHES_KEY = 'recent-searches';
const MAX_RECENT_SEARCHES = 5;

// Highlight matched text component
const HighlightText = memo(
  ({ text, query }: { text: string; query: string }) => {
    if (!query.trim()) return <>{text}</>;

    const fuse = new Fuse([text], { threshold: 0.4 });
    const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escapedQuery.split('').join('.*?')})`, 'gi');
    const parts = text.split(regex);

    return (
      <>
        {parts.map((part, i) => {
          const isMatch =
            query.toLowerCase().includes(part.toLowerCase()) ||
            part.toLowerCase().includes(query.toLowerCase());
          return isMatch && part.toLowerCase() !== text.toLowerCase() ? (
            <mark
              key={i}
              className='bg-green-200 text-green-900 rounded px-0.5'
            >
              {part}
            </mark>
          ) : (
            <span key={i}>{part}</span>
          );
        })}
      </>
    );
  },
);
HighlightText.displayName = 'HighlightText';

// Skeleton loader for search results
const SearchSkeleton = memo(() => (
  <div className='px-4 py-3'>
    {[...Array(3)].map((_, i) => (
      <div key={i} className='flex items-center gap-3 py-2'>
        <div className='w-10 h-10 bg-gray-200 rounded-lg animate-pulse' />
        <div className='flex-1 space-y-2'>
          <div className='h-3 bg-gray-200 rounded w-3/4 animate-pulse' />
          <div className='h-2 bg-gray-200 rounded w-1/2 animate-pulse' />
        </div>
      </div>
    ))}
  </div>
));
SearchSkeleton.displayName = 'SearchSkeleton';

const NavbarSearch = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchProduct[]>([]);
  const [trendingProducts, setTrendingProducts] = useState<SearchProduct[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);
  const router = useRouter();

  // Load recent searches from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(RECENT_SEARCHES_KEY);
      if (saved) {
        setRecentSearches(JSON.parse(saved));
      }
    } catch {
      // Ignore localStorage errors
    }
  }, []);

  // Save recent search
  const saveRecentSearch = useCallback(
    (searchQuery: string) => {
      if (!searchQuery.trim()) return;
      try {
        const updated = [
          searchQuery,
          ...recentSearches.filter((s) => s !== searchQuery),
        ].slice(0, MAX_RECENT_SEARCHES);
        setRecentSearches(updated);
        localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
      } catch {
        // Ignore localStorage errors
      }
    },
    [recentSearches],
  );

  // Fetch trending products for default state
  useEffect(() => {
    const fetchTrending = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_SITE_URL}/api/products?limit=5`,
        );
        const json: ApiResponse = await res.json();
        if (json.success) {
          setTrendingProducts(json.data.slice(0, 4));
        }
      } catch (err) {
        console.error('Error fetching trending:', err);
      }
    };
    fetchTrending();
  }, []);

  // Debounced search function
  const debouncedSearch = useRef(
    debounce(async (searchQuery: string) => {
      if (!searchQuery.trim()) {
        setResults([]);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_SITE_URL}/api/products?q=${encodeURIComponent(searchQuery)}`,
        );
        const json: ApiResponse = await res.json();
        setResults(json.data);
        setActiveIndex(0);
      } catch (err) {
        console.error('Error fetching:', err);
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 300),
  ).current;

  useEffect(() => {
    debouncedSearch(query);
    return () => debouncedSearch.cancel();
  }, [query, debouncedSearch]);

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Scroll into view when activeIndex changes
  useEffect(() => {
    const activeEl = itemRefs.current[activeIndex];
    if (activeEl) {
      activeEl.scrollIntoView({
        block: 'nearest',
        behavior: 'smooth',
      });
    }
  }, [activeIndex]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const items = getDisplayItems();

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((prev) => (prev === items.length - 1 ? 0 : prev + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((prev) => (prev <= 0 ? items.length - 1 : prev - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const selected = items[activeIndex] || items[0];
      if (selected) {
        handleSelect(selected);
      }
    } else if (e.key === 'Escape') {
      setShowDropdown(false);
      inputRef.current?.blur();
    }
  };

  const handleSelect = (item: SearchProduct) => {
    saveRecentSearch(query);
    router.push(`/products/${item.slug}`);
    setShowDropdown(false);
    setQuery('');
    setResults([]);
  };

  const handleRecentClick = (search: string) => {
    setQuery(search);
    debouncedSearch(search);
  };

  const clearRecentSearches = (e: React.MouseEvent) => {
    e.stopPropagation();
    setRecentSearches([]);
    try {
      localStorage.removeItem(RECENT_SEARCHES_KEY);
    } catch {
      // Ignore
    }
  };

  // Get items to display in dropdown
  const getDisplayItems = () => {
    if (query.trim() && results.length > 0) return results;
    if (query.trim()) return [];
    return trendingProducts;
  };

  const displayItems = getDisplayItems();
  const showRecent = !query.trim() && recentSearches.length > 0;
  const showTrending =
    !query.trim() && !showRecent && trendingProducts.length > 0;
  const showEmpty = query.trim() && !isLoading && results.length === 0;

  return (
    <div className='relative w-full'>
      <Input
        ref={inputRef}
        type='text'
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setShowDropdown(true);
          setActiveIndex(-1);
        }}
        onFocus={() => setShowDropdown(true)}
        onKeyDown={handleKeyDown}
        placeholder='Search products...'
        className='pr-12 rounded-xl border !border-gray-300 shadow-sm focus:!border-green-600 focus:ring-2 focus:!ring-green-300 transition'
      />
      <Search className='absolute top-1/2 right-3 -translate-y-1/2 w-5 h-5 text-green-500 pointer-events-none' />

      {showDropdown && (
        <div
          ref={dropdownRef}
          className='absolute z-50 mt-2 w-full bg-white border border-gray-200 rounded-xl shadow-lg max-h-80 overflow-y-auto'
        >
          {/* Loading State */}
          {isLoading && <SearchSkeleton />}

          {/* Recent Searches */}
          {showRecent && !isLoading && (
            <div className='px-4 py-3'>
              <div className='flex items-center justify-between mb-2'>
                <div className='flex items-center gap-2 text-gray-500 text-sm'>
                  <Clock className='w-4 h-4' />
                  <span className='font-medium'>Recent Searches</span>
                </div>
                <button
                  onClick={clearRecentSearches}
                  className='text-xs text-gray-400 hover:text-red-500 transition-colors'
                >
                  Clear
                </button>
              </div>
              {recentSearches.map((search, index) => (
                <div
                  key={`recent-${index}`}
                  ref={(el) => {
                    itemRefs.current[index] = el;
                  }}
                  onClick={() => handleRecentClick(search)}
                  onMouseEnter={() => setActiveIndex(index)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer text-sm transition-colors ${
                    index === activeIndex
                      ? 'bg-green-100 text-green-800'
                      : 'hover:bg-gray-100'
                  }`}
                >
                  <Clock className='w-4 h-4 text-gray-400' />
                  <span>{search}</span>
                </div>
              ))}
            </div>
          )}

          {/* Trending Products */}
          {showTrending && !isLoading && (
            <div className='px-4 py-3'>
              <div className='flex items-center gap-2 text-gray-500 text-sm mb-2'>
                <TrendingUp className='w-4 h-4' />
                <span className='font-medium'>Trending Products</span>
              </div>
              {trendingProducts.map((item, index) => {
                const itemIndex = recentSearches.length + index;
                return (
                  <div
                    key={item.id}
                    ref={(el) => {
                      itemRefs.current[itemIndex] = el;
                    }}
                    onClick={() => handleSelect(item)}
                    onMouseEnter={() => setActiveIndex(itemIndex)}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                      itemIndex === activeIndex
                        ? 'bg-green-100'
                        : 'hover:bg-gray-100'
                    }`}
                  >
                    <div className='relative w-10 h-10 rounded-lg overflow-hidden flex-shrink-0'>
                      <Image
                        src={item.image}
                        alt={item.title}
                        fill
                        className='object-cover'
                      />
                    </div>
                    <div className='flex-1 min-w-0'>
                      <p className='text-sm font-medium text-gray-800 truncate'>
                        {item.title}
                      </p>
                      <p className='text-xs text-gray-500'>
                        ৳{item.price.toFixed(2)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Search Results */}
          {!isLoading && results.length > 0 && (
            <div className='py-2'>
              {results.map((item, index) => (
                <div
                  key={item.id}
                  ref={(el) => {
                    itemRefs.current[index] = el;
                  }}
                  onClick={() => handleSelect(item)}
                  onMouseEnter={() => setActiveIndex(index)}
                  className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors ${
                    index === activeIndex ? 'bg-green-100' : 'hover:bg-gray-50'
                  }`}
                >
                  <div className='relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 border'>
                    <Image
                      src={item.image}
                      alt={item.title}
                      fill
                      className='object-cover'
                    />
                  </div>
                  <div className='flex-1 min-w-0'>
                    <p className='text-sm font-medium text-gray-800 truncate'>
                      <HighlightText text={item.title} query={query} />
                    </p>
                    <div className='flex items-center gap-2 mt-0.5'>
                      <span className='text-xs text-gray-500'>
                        {item.brand}
                      </span>
                      <span className='text-xs text-gray-300'>•</span>
                      <span className='text-xs text-gray-500'>
                        {item.medicineType}
                      </span>
                    </div>
                  </div>
                  <div className='text-right flex-shrink-0'>
                    <p className='text-sm font-semibold text-green-600'>
                      ৳{item.price.toFixed(2)}
                    </p>
                    {item.stock <= 0 ? (
                      <span className='text-xs text-red-500'>Out of stock</span>
                    ) : item.stock < 10 ? (
                      <span className='text-xs text-orange-500'>
                        {item.stock} left
                      </span>
                    ) : (
                      <span className='text-xs text-green-600'>In stock</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Empty State */}
          {showEmpty && (
            <div className='px-4 py-8 text-center'>
              <PackageX className='w-12 h-12 text-gray-300 mx-auto mb-3' />
              <p className='text-gray-500 font-medium'>No results found</p>
              <p className='text-sm text-gray-400 mt-1'>
                Try different keywords or check spelling
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default memo(NavbarSearch);
