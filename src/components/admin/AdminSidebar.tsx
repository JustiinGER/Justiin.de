"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Activity, LayoutDashboard, LogOut, Menu, Settings, X } from "lucide-react";
import { useState, useEffect } from "react";

type AdminNav = "dashboard" | "settings" | "monitor";

type AdminSidebarProps = {
  activeNav: AdminNav;
  children?: React.ReactNode;
};

const navItems: { id: AdminNav; label: string; href: string; icon: React.ElementType }[] = [
  { id: "dashboard", label: "Content", href: "/admin/dashboard", icon: LayoutDashboard },
  { id: "monitor", label: "Monitor", href: "/admin/monitor", icon: Activity },
  { id: "settings", label: "Settings", href: "/admin/settings", icon: Settings },
];

export function AdminSidebar({ activeNav, children }: AdminSidebarProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsOpen(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const handleLogout = async () => {
    try {
      await fetch("/api/admin/logout", { method: "POST", credentials: "include" });
    } catch {
      // Ignore fetch errors, proceed with logout anyway
    }
    sessionStorage.removeItem("admin_token");
    router.push("/admin");
  };

  const closeSidebar = () => setIsOpen(false);

  return (
    <>
      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-14 bg-brand-card/95 backdrop-blur-md border-b border-brand-border flex items-center justify-between px-4 z-40">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-brand-accent/20 text-brand-accent rounded-lg flex items-center justify-center">
            <LayoutDashboard className="w-4 h-4" />
          </div>
          <span className="font-semibold text-brand-text tracking-wide">Admin</span>
        </div>
        <button
          onClick={() => setIsOpen(true)}
          className="p-2 rounded-lg text-brand-muted hover:bg-brand-card hover:text-brand-text transition-colors"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-40"
          onClick={closeSidebar}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed md:static inset-y-0 left-0 z-50
          w-64 border-r border-brand-border bg-brand-card/95 md:bg-brand-card/50 
          flex flex-col backdrop-blur-md md:backdrop-blur-none
          transform transition-transform duration-200 ease-in-out
          ${isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
        `}
      >
        <div className="p-6 border-b border-brand-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-brand-accent/20 text-brand-accent rounded-lg flex items-center justify-center">
              <LayoutDashboard className="w-4 h-4" />
            </div>
            <span className="font-semibold text-brand-text tracking-wide">Admin</span>
          </div>
          <button
            onClick={closeSidebar}
            className="md:hidden p-1.5 rounded-lg text-brand-muted hover:bg-brand-card hover:text-brand-text transition-colors"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
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
                onClick={closeSidebar}
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
    </>
  );
}
