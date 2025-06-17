import { Button } from "@/components/ui/button";
import { Wand2 } from "lucide-react";

interface HeaderProps {
  title: string;
  description: string;
  showGenerateButton?: boolean;
  onGenerateClick?: () => void;
}

export function Header({ title, description, showGenerateButton = false, onGenerateClick }: HeaderProps) {
  return (
    <header className="bg-white dark:bg-card border-b border-neutral-100 dark:border-border px-8 py-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-900 font-inter">{title}</h2>
          <p className="text-neutral-500 mt-1">{description}</p>
        </div>
        
        {showGenerateButton && (
          <Button 
            onClick={onGenerateClick}
            className="bg-primary hover:bg-blue-700 text-white px-6 py-3 font-medium flex items-center space-x-2 shadow-sm"
          >
            <Wand2 className="w-4 h-4" />
            <span>Generate Meal Plan</span>
          </Button>
        )}
      </div>
    </header>
  );
}
