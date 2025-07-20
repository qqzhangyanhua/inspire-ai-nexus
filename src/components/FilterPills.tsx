
import { Button } from "@/components/ui/button";

interface FilterPillsProps {
  selectedFilter: string;
  onFilterChange: (filter: string) => void;
}

const FilterPills = ({ selectedFilter, onFilterChange }: FilterPillsProps) => {
  const filters = [
    "All",
    "Neumorphism", 
    "Glassmorphism",
    "Y2K",
    "Aurora UI",
    "Minimalist",
    "Brutalist"
  ];

  return (
    <div className="flex flex-wrap gap-3 mb-8">
      {filters.map((filter) => (
        <Button
          key={filter}
          variant={selectedFilter === filter ? "default" : "outline"}
          size="sm"
          onClick={() => onFilterChange(filter)}
          className={`rounded-full px-4 py-2 transition-all duration-200 ${
            selectedFilter === filter
              ? "bg-primary text-primary-foreground shadow-lg scale-105"
              : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground hover:scale-105"
          }`}
        >
          {filter}
        </Button>
      ))}
    </div>
  );
};

export default FilterPills;
