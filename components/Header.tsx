
import { Search, User, LogOut, Plus, BarChart3, Database } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { useUserStore } from "@/stores/useUserStore";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface HeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

const Header = ({ searchQuery, onSearchChange }: HeaderProps) => {
  const { user, signOut, loading } = useAuth();
  const { profile } = useUserStore();
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Left - Logo */}
        <Link href="/" className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-lg">I</span>
          </div>
          <span className="font-bold text-xl">Inspire-AI</span>
        </Link>

        {/* Center - Navigation */}
        <nav className="hidden md:flex items-center space-x-8">
          <Link href="/" className="text-foreground hover:text-primary transition-colors">
            探索
          </Link>
          {user && (
            <Link href="/dashboard" className="text-foreground hover:text-primary transition-colors">
              工作台
            </Link>
          )}
          {user && (
            <Link href="/ai-tools" className="text-foreground hover:text-primary transition-colors">
              AI工具
            </Link>
          )}
          {user && profile?.role === 'Admin' && (
            <Link href="/admin/data-management" className="text-foreground hover:text-primary transition-colors">
              数据管理
            </Link>
          )}
          <span className="text-muted-foreground hover:text-primary transition-colors cursor-pointer">
            社区
          </span>
        </nav>

        {/* Right - Search, Contribute, Profile */}
        <div className="flex items-center space-x-4">
          <div className="relative hidden sm:block">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="搜索灵感..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-64 pl-10 bg-muted/50 border-muted"
            />
          </div>
          
          {/* Contribute Button */}
          <Link href={user ? "/case/create" : "/auth"}>
            <Button className="bg-primary hover:bg-primary/90">
              <Plus className="w-4 h-4 mr-2" />
              贡献
            </Button>
          </Link>
          
          {/* Auth Section */}
          {loading ? (
            <div className="w-8 h-8 rounded-full bg-muted animate-pulse"></div>
          ) : user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <User className="w-5 h-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem className="font-medium">
                  {user.email}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <Link href="/dashboard">
                  <DropdownMenuItem>
                    <BarChart3 className="w-4 h-4 mr-2" />
                    工作台
                  </DropdownMenuItem>
                </Link>
                {profile?.role === 'Admin' && (
                  <Link href="/admin/data-management">
                    <DropdownMenuItem>
                      <Database className="w-4 h-4 mr-2" />
                      数据管理
                    </DropdownMenuItem>
                  </Link>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={signOut} className="text-destructive">
                  <LogOut className="w-4 h-4 mr-2" />
                  登出
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link href="/auth">
              <Button variant="outline" size="sm">
                登录
              </Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
