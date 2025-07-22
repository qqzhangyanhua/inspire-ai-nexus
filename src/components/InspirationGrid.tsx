
import InspirationCard from "./InspirationCard";

interface InspirationGridProps {
  selectedFilter: string;
  searchQuery: string;
}

const InspirationGrid = ({ selectedFilter, searchQuery }: InspirationGridProps) => {
  // Mock data - in a real app, this would come from an API
  const mockCards = [
    {
      id: "1",
      title: "毛玻璃仪表板",
      imageUrl: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=300&fit=crop",
      category: "毛玻璃风格",
      isFavorited: false
    },
    {
      id: "2", 
      title: "新拟物计算器",
      imageUrl: "https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?w=400&h=350&fit=crop",
      category: "新拟物主义",
      isFavorited: true
    },
    {
      id: "3",
      title: "Y2K作品集网站",
      imageUrl: "https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=400&h=280&fit=crop",
      category: "Y2K风格",
      isFavorited: false
    },
    {
      id: "4",
      title: "极光登录表单",
      imageUrl: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=400&h=320&fit=crop",
      category: "极光界面",
      isFavorited: false
    },
    {
      id: "5",
      title: "极简博客",
      imageUrl: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=400&h=300&fit=crop",
      category: "极简主义",
      isFavorited: true
    },
    {
      id: "6",
      title: "野兽派落地页",
      imageUrl: "https://images.unsplash.com/photo-1487058792275-0ad4aaf24ca7?w=400&h=280&fit=crop",
      category: "野兽派",
      isFavorited: false
    }
  ];

  const filteredCards = mockCards.filter(card => {
    const matchesFilter = selectedFilter === "全部" || card.category === selectedFilter;
    const matchesSearch = searchQuery === "" || 
      card.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      card.category.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="masonry-grid">
      {filteredCards.map((card) => (
        <div key={card.id} className="masonry-item">
          <InspirationCard {...card} />
        </div>
      ))}
    </div>
  );
};

export default InspirationGrid;
