
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
      title: "Glassmorphism Dashboard",
      imageUrl: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=300&fit=crop",
      category: "Glassmorphism",
      isFavorited: false
    },
    {
      id: "2", 
      title: "Neumorphic Calculator",
      imageUrl: "https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?w=400&h=350&fit=crop",
      category: "Neumorphism",
      isFavorited: true
    },
    {
      id: "3",
      title: "Y2K Portfolio Site",
      imageUrl: "https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=400&h=280&fit=crop",
      category: "Y2K",
      isFavorited: false
    },
    {
      id: "4",
      title: "Aurora Login Form",
      imageUrl: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=400&h=320&fit=crop",
      category: "Aurora UI",
      isFavorited: false
    },
    {
      id: "5",
      title: "Minimalist Blog",
      imageUrl: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=400&h=300&fit=crop",
      category: "Minimalist",
      isFavorited: true
    },
    {
      id: "6",
      title: "Brutalist Landing",
      imageUrl: "https://images.unsplash.com/photo-1487058792275-0ad4aaf24ca7?w=400&h=280&fit=crop",
      category: "Brutalist",
      isFavorited: false
    }
  ];

  const filteredCards = mockCards.filter(card => {
    const matchesFilter = selectedFilter === "All" || card.category === selectedFilter;
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
