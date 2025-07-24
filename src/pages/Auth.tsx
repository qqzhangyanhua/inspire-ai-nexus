"use client"

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

import { toast } from "sonner";

import { useRouter } from "next/navigation";

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const router = useRouter();
  const navigate = router.push;

  useEffect(() => {
    // 检查是否已登录
    const checkUser = async () => {
      try {
        const response = await fetch('/api/auth/session');
        const data = await response.json();
        
        if (response.ok && data.session?.user) {
          router.push("/");
        }
      } catch (error) {
        console.error('Error checking session:', error);
      }
    };

    checkUser();
  }, [router]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const redirectUrl = `${window.location.origin}/`;

      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          redirectUrl,
          username,
          display_name: displayName,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Registration failed');

      toast.success("注册成功！请检查邮箱并确认账户。");
    } catch (error: any) {
      if (error.message.includes("User already registered")) {
        toast.error("该邮箱已注册，请直接登录。");
      } else {
        toast.error(error.message || "注册失败");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.error || 'Login failed');

      if (data.user) {
        toast.success("登录成功！");
        router.push("/");
      }
    } catch (error: any) {
      if (error.message.includes("Invalid login credentials")) {
        toast.error("邮箱或密码错误");
      } else {
        toast.error(error.message || "登录失败");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            {isLogin ? "登录" : "注册"} Inspire-AI
          </CardTitle>
          <CardDescription className="text-center">
            {isLogin
              ? "输入您的邮箱和密码来登录您的账户"
              : "创建一个新账户来开始使用 Inspire-AI"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={isLogin ? handleSignIn : handleSignUp}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="email">邮箱</Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">密码</Label>
              <Input
                id="password"
                type="password"
                placeholder="输入您的密码"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>

            {!isLogin && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="username">用户名</Label>
                  <Input
                    id="username"
                    type="text"
                    placeholder="选择一个用户名"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="displayName">显示名称</Label>
                  <Input
                    id="displayName"
                    type="text"
                    placeholder="您的显示名称"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                  />
                </div>
              </>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "处理中..." : isLogin ? "登录" : "注册"}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {isLogin ? "还没有账户？点击注册" : "已有账户？点击登录"}
            </button>
          </div>

          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => router.push("/")}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              返回首页
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
