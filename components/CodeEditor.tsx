import { Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";

interface CodeEditorProps {
  html: string;
  css: string;
  javascript: string;
}

const CodeEditor = ({ html, css, javascript }: CodeEditorProps) => {
  const copyToClipboard = (content: string, type: string) => {
    navigator.clipboard.writeText(content);
    toast({
      title: "已复制！",
      description: `${type} 代码已复制到剪贴板`,
    });
  };

  const CodeBlock = ({
    code,
    language,
    syntaxLanguage,
  }: {
    code: string;
    language: string;
    syntaxLanguage: string;
  }) => (
    <div className="relative">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => copyToClipboard(code, language)}
        className="absolute right-2 top-2 z-10 bg-background/80 hover:bg-background"
      >
        <Copy className="w-4 h-4 mr-1" />
        复制
      </Button>
      <SyntaxHighlighter
        language={syntaxLanguage}
        style={vscDarkPlus}
        className="!bg-slate-950 !text-slate-100 !p-4 !rounded-lg !text-sm !font-mono !max-h-96 !overflow-y-auto"
        customStyle={{
          margin: 0,
          borderRadius: "0.5rem",
          maxHeight: "384px",
          fontSize: "0.875rem",
        }}
      >
        {code}
      </SyntaxHighlighter>
    </div>
  );

  return (
    <Card className="overflow-hidden">
      <div className="p-3 bg-muted/50 border-b border-border">
        <h3 className="font-semibold text-foreground">代码编辑器</h3>
      </div>

      <Tabs defaultValue="html" className="w-full">
        <TabsList className="w-full justify-start rounded-none border-b bg-muted/30">
          <TabsTrigger
            value="html"
            className="data-[state=active]:bg-background"
          >
            HTML
          </TabsTrigger>
          <TabsTrigger
            value="css"
            className="data-[state=active]:bg-background"
          >
            CSS
          </TabsTrigger>
          <TabsTrigger
            value="javascript"
            className="data-[state=active]:bg-background"
          >
            JavaScript
          </TabsTrigger>
        </TabsList>

        <TabsContent value="html" className="p-4 m-0">
          <CodeBlock code={html} language="HTML" syntaxLanguage="markup" />
        </TabsContent>

        <TabsContent value="css" className="p-4 m-0">
          <CodeBlock code={css} language="CSS" syntaxLanguage="css" />
        </TabsContent>

        <TabsContent value="javascript" className="p-4 m-0">
          <CodeBlock
            code={javascript}
            language="JavaScript"
            syntaxLanguage="javascript"
          />
        </TabsContent>
      </Tabs>
    </Card>
  );
};

export default CodeEditor;
