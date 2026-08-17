import React, { useState } from 'react';

interface SearchBarProps {
  onSearch: (query: string) => void;
}

export function SearchBar({ onSearch }: SearchBarProps) {
  const [query, setQuery] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(query);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    
    // Auto-search on input change with debouncing
    clearTimeout((window as any).searchTimeout);
    (window as any).searchTimeout = setTimeout(() => {
      if (value.trim()) {
        onSearch(value);
      }
    }, 500);
  };

  const clearSearch = () => {
    setQuery('');
    onSearch(''); // This will trigger default Top 50 trending songs
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-md mx-auto">
      <div className="relative">
        {/* Search Icon */}
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg 
            className="h-4 w-4 text-gray-400" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" 
            />
          </svg>
        </div>
        
        {/* Search Input */}
        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          placeholder="Search for artists..."
          className="w-full pl-10 pr-10 py-3 bg-black/30 border border-gray-700 rounded-full 
                     text-white placeholder-gray-500 focus:outline-none focus:border-gray-500 
                     focus:bg-black/50 transition-all duration-300 backdrop-blur-sm font-light"
          style={{
            background: 'linear-gradient(145deg, rgba(0,0,0,0.4), rgba(255,255,255,0.02))',
            boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.7), 0 1px 2px rgba(255,255,255,0.05)'
          }}
        />
        
        {/* Clear Button */}
        {query && (
          <button
            type="button"
            onClick={clearSearch}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 
                       hover:text-white transition-colors duration-200"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
      
      {/* Search suggestions/hints */}
      <div className="mt-2 text-center">
        <p className="text-xs text-gray-500 font-light">
          Search for artists like "Beatles", "Drake", "Taylor Swift" or leave empty for Top 50
        </p>
      </div>
    </form>
  );
}