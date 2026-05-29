"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { LayoutDashboard, LogOut, Settings } from "lucide-react";

type AdminNav = "dashboard" | "settings";

type AdminSidebarProps = {
  activeNav: AdminNav;
  children?: React.ReactNode;
};

const navItems: { id: AdminNav; label: string; href: string; icon: React.ElementType }[] = [
  { id: "dashboard", label: "Content", href: "/admin/dashboard", icon: LayoutDashboard },
  { id: "settings", label: "Settings", href: "/admin/settings", icon: Settings },
];

export function AdminSidebar({ activeNav, children }: AdminSidebarProps) {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch("/api/admin/logout", { method: "POST" });
    } catch {
      // Ignore fetch errors, proceed with logout anyway
    }
    sessionStorage.removeItem("admin_token");
    router.push("/admin");
  };

  return (
    <aside className="w-64 border-r border-brand-border bg-brand-card/50 flex flex-col">
      <div className="p-6 border-b border-brand-border flex items-center gap-3">
        <div className="w-8 h-8 bg-brand-accent/20 text-brand-accent rounded-lg flex items-center justify-center">
          <LayoutDashboard className="w-4 h-4" />
        </div>
        <span className="font-semibold text-brand-text tracking-wide">Admin</span>
      </div>

      {children ? (
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto border-b border-brand-border">
          {children}
        </nav>
      ) : (
        <div className="flex-1" />
      )}

      <nav className="p-4 space-y-1">
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = activeNav === item.id;
          return (
            <Link
              key={item.id}
              href={item.href}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? "bg-brand-accent/10 text-brand-accent"
                  : "text-brand-muted hover:bg-black/5 dark:hover:bg-white/5 hover:text-brand-text"
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? "text-brand-accent" : "text-brand-muted"}`} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-brand-border">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-brand-muted hover:bg-red-500/10 hover:text-red-400 transition-all"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
