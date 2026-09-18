import { ReactNode, useState } from "react";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

const SIDEBAR_COLLAPSED_KEY = "hormiwatch_sidebar_collapsed";

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { profile } = useAuth();

  // 🔒 El sidebar es estático por defecto. Solo se puede colapsar/expandir
  // si el usuario activa "Menú lateral colapsable" en Mi Configuración.
  const collapsibleSidebar = !!profile?.preferences?.collapsible_sidebar;

  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === "true";
    } catch {
      return false;
    }
  });
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleToggleCollapse = () => {
    setCollapsed((c) => {
      const next = !c;
      try {
        localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(next));
      } catch {
        // ignorar errores de almacenamiento
      }
      return next;
    });
  };

  const effectiveCollapsed = collapsibleSidebar && collapsed;

  return (
    <div className="min-h-screen bg-background">
      <Sidebar
        collapsed={effectiveCollapsed}
        onToggleCollapse={collapsibleSidebar ? handleToggleCollapse : undefined}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />
      <div
        className={cn(
          "flex min-h-screen flex-col transition-[padding] duration-300 ease-in-out",
          effectiveCollapsed ? "lg:pl-[76px]" : "lg:pl-64",
        )}
      >
        <TopBar onOpenSidebar={() => setMobileOpen(true)} />
        <main className="flex-1 bg-muted/10 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}