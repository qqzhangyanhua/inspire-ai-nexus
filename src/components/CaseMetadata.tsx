
import { Copy, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { toast } from "@/hooks/use-toast";
import { useState } from "react";

interface CaseMetadataProps {
  caseData: {
    title: string;
    tags: string[];
    contributor: {
      name: string;
      avatar: string;
    };
    prompt: string;
    structuredBreakdown: Array<{
      emoji: string;
      title: string;
      value: string;
    }>;
  };
}

const CaseMetadata = ({ caseData }: CaseMetadataProps) => {
  const [isBreakdownOpen, setIsBreakdownOpen] = useState(false);

  const copyPrompt = () => {
    navigator.clipboard.writeText(caseData.prompt);
    toast({
      title: "Prompt copied!",
      description: "The AI prompt has been copied to your clipboard",
    });
  };

  return (
    <div className="space-y-6">
      {/* Title and Tags */}
      <Card className="p-6">
        <h1 className="text-2xl font-bold text-foreground mb-4">
          {caseData.title}
        </h1>
        
        <div className="flex flex-wrap gap-2 mb-4">
          {caseData.tags.map((tag) => (
            <span
              key={tag}
              className="px-3 py-1 text-sm bg-primary/10 text-primary rounded-full"
            >
              {tag}
            </span>
          ))}
        </div>
      </Card>

      {/* Contributor Info */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-foreground mb-3">
          Contributor
        </h3>
        
        <div className="flex items-center space-x-3">
          <Avatar>
            <AvatarImage src={caseData.contributor.avatar} />
            <AvatarFallback>
              {caseData.contributor.name.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <span className="font-medium text-foreground">
            {caseData.contributor.name}
          </span>
        </div>
      </Card>

      {/* Prompt Box - The Most Important Component */}
      <Card className="p-6 bg-accent/50 border-accent">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-foreground">
            AI Prompt
          </h3>
          <Button onClick={copyPrompt} variant="outline" size="sm">
            <Copy className="w-4 h-4 mr-2" />
            Copy Prompt
          </Button>
        </div>
        
        <div className="bg-muted/50 rounded-lg p-4 mb-4">
          <p className="text-sm font-mono text-foreground leading-relaxed">
            {caseData.prompt}
          </p>
        </div>

        {/* Structured Breakdown Collapsible */}
        <Collapsible open={isBreakdownOpen} onOpenChange={setIsBreakdownOpen}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full justify-between p-0 h-auto">
              <span className="text-sm font-medium text-foreground">
                Structured Breakdown
              </span>
              {isBreakdownOpen ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </Button>
          </CollapsibleTrigger>
          
          <CollapsibleContent className="mt-4">
            <div className="space-y-3">
              {caseData.structuredBreakdown.map((item, index) => (
                <div key={index} className="flex items-start space-x-3 p-3 bg-muted/30 rounded-lg">
                  <span className="text-lg" role="img" aria-label={item.title}>
                    {item.emoji}
                  </span>
                  <div className="flex-1">
                    <dt className="font-medium text-foreground text-sm">
                      {item.title}
                    </dt>
                    <dd className="text-muted-foreground text-sm mt-1">
                      {item.value}
                    </dd>
                  </div>
                </div>
              ))}
            </div>
          </CollapsibleContent>
        </Collapsible>
      </Card>
    </div>
  );
};

export default CaseMetadata;
