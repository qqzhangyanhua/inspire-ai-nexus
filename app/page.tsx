'use client';

import Header from '@/components/Header';
import FilterPills from '@/components/FilterPills';
import InspirationGrid from '@/components/InspirationGrid';
import { useState } from 'react';

export default function HomePage() {
  const [selectedFilter, setSelectedFilter] = useState('全部');
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="min-h-screen bg-background">
      <Header searchQuery={searchQuery} onSearchChange={setSearchQuery} />
      
      <main className="container mx-auto px-4 py-8">
        <FilterPills 
          selectedFilter={selectedFilter} 
          onFilterChange={setSelectedFilter}
        />
        
        <InspirationGrid 
          selectedFilter={selectedFilter}
          searchQuery={searchQuery}
        />
      </main>
    </div>
  );
}