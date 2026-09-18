import { Outlet, createFileRoute, useLocation, useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { AppHeader } from "@/components/layout/AppHeader";
import { Toaster } from "@/components/ui/sonner";
import { readAuthSession } from "@/lib/auth";

export const Route = createFileRoute("/_app")({
  component: AppLayout,
});

function AppLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const routeKey = `${location.pathname}${JSON.stringify(location.search)}`;
  const [pageTransitionClass, setPageTransitionClass] = useState("page-transition");
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    setPageTransitionClass("page-transition page-transition-reset");
    const frame = window.requestAnimationFrame(() => {
      setPageTransitionClass("page-transition");
    });

    return () => window.cancelAnimationFrame(frame);
  }, [routeKey]);

  useEffect(() => {
    if (readAuthSession()) {
      setAuthorized(true);
      return;
    }

    void navigate({ to: "/login" });
  }, [navigate]);

  if (!authorized) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-muted-foreground">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
          Verificando acesso...
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />
        <SidebarInset className="flex min-w-0 flex-1 flex-col">
          <AppHeader />
          <main className="flex-1">
            <div className={pageTransitionClass}>
              <Outlet />
            </div>
          </main>
        </SidebarInset>
      </div>
      <Toaster position="top-right" richColors />
    </SidebarProvider>
  );
}
