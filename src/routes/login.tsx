import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Activity, AlertCircle, Lock, LogIn, User } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { authenticateMockUser, readAuthSession, storeAuthSession } from "@/lib/auth";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Login - FalAI Doutor" },
      {
        name: "description",
        content: "Acesso autenticado ao sistema de triagem FalAI Doutor.",
      },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (readAuthSession()) {
      void navigate({ to: "/" });
    }
  }, [navigate]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    const user = authenticateMockUser(username, password);
    if (!user) {
      setSubmitting(false);
      setError("Usuário ou senha inválidos.");
      return;
    }

    storeAuthSession(user);
    await navigate({ to: "/" });
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_hsl(var(--primary)/0.18),_transparent_34rem)]" />
      <section className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-xl">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Activity className="h-6 w-6" strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-foreground">FalAI Doutor</h1>
            <p className="text-sm text-muted-foreground">Acesso ao sistema de triagem</p>
          </div>
        </div>

        <form className="space-y-4" onSubmit={submit}>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Usuário
            </label>
            <div className="relative mt-2">
              <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={username}
                onChange={(event) => {
                  setUsername(event.target.value);
                  setError(null);
                }}
                autoComplete="username"
                className="h-11 pl-9"
                placeholder="admin"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Senha
            </label>
            <div className="relative mt-2">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value);
                  setError(null);
                }}
                type="password"
                autoComplete="current-password"
                className="h-11 pl-9"
                placeholder="Senha"
              />
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm font-medium text-destructive">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          )}

          <Button type="submit" className="h-11 w-full gap-2" disabled={submitting}>
            <LogIn className="h-4 w-4" />
            Entrar
          </Button>
        </form>
      </section>
    </main>
  );
}
