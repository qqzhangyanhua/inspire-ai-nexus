
import { useEffect, useState } from "react";
import InspirationCard from "./InspirationCard";
import { supabase } from "@/integrations/supabase/client";
import { useUserStore } from "@/stores/useUserStore";

interface InspirationGridProps {
  selectedFilter: string;
  searchQuery: string;
}

interface CaseWithCategory {
  id: string;
  title: string;
  image_url: string;
  category: {
    name_zh: string;
  } | null;
  isFavorited: boolean;
}

const InspirationGrid = ({ selectedFilter, searchQuery }: InspirationGridProps) => {
  const [cases, setCases] = useState<CaseWithCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, favoriteIds, fetchFavorites } = useUserStore();

  useEffect(() => {
    fetchCases();
    if (user) {
      fetchFavorites();
    }
  }, [user, fetchFavorites]);

  const fetchCases = async () => {
    try {
      const { data, error } = await supabase
        .from('cases')
        .select(`
          id,
          title,
          image_url,
          category:categories(name_zh)
        `)
        .eq('status', 'published');

      if (error) throw error;

      const casesWithFavorites = data?.map(item => ({
        id: item.id,
        title: item.title,
        image_url: item.image_url,
        category: item.category,
        isFavorited: favoriteIds.includes(item.id)
      })) || [];

      setCases(casesWithFavorites);
    } catch (error) {
      console.error('Error fetching cases:', error);
    } finally {
      setLoading(false);
    }
  };

  // 当收藏状态变化时更新案例列表
  useEffect(() => {
    setCases(prev => prev.map(item => ({
      ...item,
      isFavorited: favoriteIds.includes(item.id)
    })));
  }, [favoriteIds]);

  const filteredCards = cases.filter(card => {
    const categoryName = card.category?.name_zh || '';
    const matchesFilter = selectedFilter === "全部" || categoryName === selectedFilter;
    const matchesSearch = searchQuery === "" || 
      card.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      categoryName.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesFilter && matchesSearch;
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <div className="text-muted-foreground">加载中...</div>
      </div>
    );
  }

  return (
    <div className="masonry-grid">
      {filteredCards.map((card) => (
        <div key={card.id} className="masonry-item">
          <InspirationCard 
            id={card.id}
            title={card.title}
            imageUrl={card.image_url}
            category={card.category?.name_zh || ''}
            isFavorited={card.isFavorited}
          />
        </div>
      ))}
    </div>
  );
};

export default InspirationGrid;
