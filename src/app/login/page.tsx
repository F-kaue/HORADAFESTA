"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PartyPopper } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      toast.error("E-mail ou senha incorretos");
      return;
    }
    router.push("/dashboard");
    router.refresh();
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-surface px-4">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {[...Array(12)].map((_, i) => (
          <span
            key={i}
            className="animate-confetti absolute text-2xl opacity-30"
            style={{
              left: `${(i * 17) % 100}%`,
              top: `${(i * 23) % 100}%`,
              animationDelay: `${i * 0.5}s`,
            }}
          >
            {["🎈", "🎉", "✨", "🎊"][i % 4]}
          </span>
        ))}
      </div>

      <div className="relative w-full max-w-md rounded-2xl border bg-white p-8 shadow-warm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
            <PartyPopper className="h-8 w-8 text-primary" />
          </div>
          <h1 className="font-display text-3xl font-bold text-secondary">
            Hora da Festa
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Buffet & Eventos — CRM
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Senha</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>
          <Button type="submit" className="w-full" size="lg" disabled={loading}>
            {loading ? "Entrando..." : "Entrar"}
          </Button>
        </form>
      </div>
    </div>
  );
}
