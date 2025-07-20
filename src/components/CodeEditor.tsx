
import { Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";

interface CodeEditorProps {
  html: string;
  css: string;
  javascript: string;
}

const CodeEditor = ({ html, css, javascript }: CodeEditorProps) => {
  const copyToClipboard = (content: string, type: string) => {
    navigator.clipboard.writeText(content);
    toast({
      title: "Copied!",
      description: `${type} code copied to clipboard`,
    });
  };

  const CodeBlock = ({ code, language }: { code: string; language: string }) => (
    <div className="relative">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => copyToClipboard(code, language)}
        className="absolute right-2 top-2 z-10 bg-background/80 hover:bg-background"
      >
        <Copy className="w-4 h-4 mr-1" />
        Copy
      </Button>
      <pre className="bg-slate-950 text-slate-100 p-4 rounded-lg overflow-x-auto text-sm font-mono max-h-96 overflow-y-auto">
        <code>{code}</code>
      </pre>
    </div>
  );

  return (
    <Card className="overflow-hidden">
      <div className="p-3 bg-muted/50 border-b border-border">
        <h3 className="font-semibold text-foreground">Code Editor</h3>
      </div>
      
      <Tabs defaultValue="html" className="w-full">
        <TabsList className="w-full justify-start rounded-none border-b bg-muted/30">
          <TabsTrigger value="html" className="data-[state=active]:bg-background">
            HTML
          </TabsTrigger>
          <TabsTrigger value="css" className="data-[state=active]:bg-background">
            CSS
          </TabsTrigger>
          <TabsTrigger value="javascript" className="data-[state=active]:bg-background">
            JavaScript
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="html" className="p-4 m-0">
          <CodeBlock code={html} language="HTML" />
        </TabsContent>
        
        <TabsContent value="css" className="p-4 m-0">
          <CodeBlock code={css} language="CSS" />
        </TabsContent>
        
        <TabsContent value="javascript" className="p-4 m-0">
          <CodeBlock code={javascript} language="JavaScript" />
        </TabsContent>
      </Tabs>
    </Card>
  );
};

export default CodeEditor;
