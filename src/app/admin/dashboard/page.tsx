"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  User, Server, Heart, 
  Cpu, Link as LinkIcon, Save, Loader2, Check, AlertCircle
} from "lucide-react";
import { AboutMeForm } from "@/components/admin/AboutMeForm";
import type { SiteContent } from "@/lib/content.server";

import { Hero } from "@/components/Hero";
import { Lab } from "@/components/Lab";
import { Passions } from "@/components/Passions";
import { Gear } from "@/components/Gear";
import { Contact } from "@/components/Contact";

import { LabForm } from "@/components/admin/LabForm";
import { GearForm } from "@/components/admin/GearForm";
import { PassionsForm } from "@/components/admin/PassionsForm";
import { ContactForm } from "@/components/admin/ContactForm";
import { JsonEditor } from "@/components/admin/JsonEditor";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { useAutoLogout } from "@/hooks/useAutoLogout";
import { getAdminToken } from "@/lib/admin-session.client";

type Tab = "aboutMe" | "lab" | "passions" | "gear" | "contactData";

const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: "aboutMe", label: "About Me", icon: User },
  { id: "lab", label: "The Lab", icon: Server },
  { id: "passions", label: "Passions", icon: Heart },
  { id: "gear", label: "Gear", icon: Cpu },
  { id: "contactData", label: "Contact", icon: LinkIcon },
];

export default function AdminDashboard() {
  const router = useRouter();
  useAutoLogout();
  const [activeTab, setActiveTab] = useState<Tab>("aboutMe");
  const [viewMode, setViewMode] = useState<"form" | "json" | "split">("split");
  const [content, setContent] = useState<SiteContent | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">("idle");
  const [savedContentStrings, setSavedContentStrings] = useState<Record<string, string>>({});

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const token = await getAdminToken();
      if (cancelled) return;

      if (!token) {
        router.push("/admin");
        return;
      }

      fetch("/api/admin/content", {
        headers: { Authorization: `Bearer ${token}` },
        credentials: "include",
      })
      .then(res => {
        if (res.status === 401) {
          sessionStorage.removeItem("admin_token");
          router.push("/admin");
          throw new Error("Unauthorized");
        }
        return res.json();
      })
      .then(data => {
        if (data.content) {
          setContent(data.content);
          setSavedContentStrings(
            Object.fromEntries(
              Object.entries(data.content).map(([k, v]) => [k, JSON.stringify(v)])
            )
          );
        }
        setIsLoading(false);
      })
      .catch(err => {
        console.error(err);
        setIsLoading(false);
      });
    })();

    return () => {
      cancelled = true;
    };
  }, [router]);

  const handleSave = useCallback(async () => {
    if (!content) return;
    
    setIsSaving(true);
    setSaveStatus("idle");
    const token = await getAdminToken();
    if (!token) {
      router.push("/admin");
      return;
    }

    try {
      const res = await fetch("/api/admin/content", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
        body: JSON.stringify({
          section: activeTab,
          data: content[activeTab]
        })
      });

      if (res.ok) {
        setSaveStatus("success");
        setSavedContentStrings(prev => ({ ...prev, [activeTab]: JSON.stringify(content[activeTab]) }));
        setTimeout(() => setSaveStatus("idle"), 3000);
      } else {
        setSaveStatus("error");
      }
    } catch (err) {
      setSaveStatus("error");
    } finally {
      setIsSaving(false);
    }
  }, [content, activeTab, router]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [handleSave]);

  const hasUnsavedChanges = (tabId: string) =>
    content && savedContentStrings[tabId]
      ? JSON.stringify((content as any)[tabId]) !== savedContentStrings[tabId]
      : false;

  const updateField = (path: string[], value: any) => {
    if (!content) return;
    
    setContent(prev => {
      if (!prev) return prev;
      const newData = JSON.parse(JSON.stringify(prev)); // Deep clone
      let current = newData;
      for (let i = 0; i < path.length - 1; i++) {
        current = current[path[i]];
      }
      current[path[path.length - 1]] = value;
      return newData;
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-bg">
        <Loader2 className="w-8 h-8 text-brand-accent animate-spin" />
      </div>
    );
  }

  if (!content) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-brand-bg">
        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
        <h2 className="text-xl font-semibold text-brand-text">Failed to load content</h2>
        <button
          onClick={() => {
            sessionStorage.removeItem("admin_token");
            router.push("/admin");
          }}
          className="mt-4 text-brand-accent hover:underline"
        >
          Return to Login
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-bg flex">
      <AdminSidebar activeNav="dashboard">
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          const isDirty = hasUnsavedChanges(tab.id);
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive 
                  ? "bg-brand-accent/10 text-brand-accent" 
                  : "text-brand-muted hover:bg-black/5 dark:hover:bg-white/5 hover:text-brand-text"
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? "text-brand-accent" : "text-brand-muted"}`} />
              <span className="flex-1 text-left">{tab.label}</span>
              {isDirty && (
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse shrink-0" />
              )}
            </button>
          );
        })}
      </AdminSidebar>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="h-20 border-b border-brand-border bg-brand-card/30 flex items-center justify-between px-8 backdrop-blur-md">
          <div className="flex items-center gap-6">
            <h1 className="text-xl font-semibold text-brand-text flex items-center gap-2">
              Editing: <span className="text-brand-accent">{tabs.find(t => t.id === activeTab)?.label}</span>
            </h1>
            
            <div className="flex items-center bg-brand-card border border-brand-border rounded-lg p-1">
              <button
                onClick={() => setViewMode("form")}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${viewMode === "form" ? "bg-brand-accent/10 text-brand-accent shadow-sm" : "text-brand-muted hover:text-brand-text"}`}
              >
                Form
              </button>
              <button
                onClick={() => setViewMode("json")}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${viewMode === "json" ? "bg-brand-accent/10 text-brand-accent shadow-sm" : "text-brand-muted hover:text-brand-text"}`}
              >
                JSON
              </button>
              <button
                onClick={() => setViewMode("split")}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${viewMode === "split" ? "bg-brand-accent/10 text-brand-accent shadow-sm" : "text-brand-muted hover:text-brand-text"}`}
              >
                Split View
              </button>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <AnimatePresence>
              {saveStatus === "success" && (
                <motion.span 
                  initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
                  className="flex items-center gap-1.5 text-sm text-green-400 bg-green-400/10 px-3 py-1.5 rounded-lg border border-green-400/20"
                >
                  <Check className="w-4 h-4" /> Saved
                </motion.span>
              )}
              {saveStatus === "error" && (
                <motion.span 
                  initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
                  className="flex items-center gap-1.5 text-sm text-red-400 bg-red-400/10 px-3 py-1.5 rounded-lg border border-red-400/20"
                >
                  <AlertCircle className="w-4 h-4" /> Error saving
                </motion.span>
              )}
            </AnimatePresence>
            
            <div className="flex items-center gap-2">
              <span className="text-xs text-brand-muted hidden lg:block select-none">Ctrl+S</span>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="relative flex items-center gap-2 px-5 py-2.5 bg-brand-accent hover:bg-brand-accent/90 text-brand-bg font-semibold rounded-xl transition-all disabled:opacity-50"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save Changes
                {hasUnsavedChanges(activeTab) && !isSaving && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-400 rounded-full animate-pulse" />
                )}
              </button>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-hidden flex">
          {/* Editor Side */}
          <div className={`${viewMode === "split" ? "w-1/2 border-r border-brand-border" : "w-full"} h-full overflow-y-auto p-8`}>
            <div className="max-w-4xl mx-auto space-y-8 pb-20">
              {viewMode === "json" ? (
                <div className="space-y-4">
                  <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl text-blue-400 text-sm flex gap-3">
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    <p>Advanced Mode: You are editing the raw JSON structure. Syntax errors will prevent saving.</p>
                  </div>
                  <JsonEditor 
                    value={content[activeTab]} 
                    onChange={(parsed) => setContent(prev => prev ? { ...prev, [activeTab]: parsed } : prev)} 
                  />
                </div>
              ) : (
                <>
                  {activeTab === "aboutMe" && (
                    <AboutMeForm
                      data={content.aboutMe}
                      onChange={(v) => updateField(["aboutMe"], v)}
                    />
                  )}

                  {activeTab === "lab" && <LabForm data={content.lab} onChange={(v) => updateField(["lab"], v)} />}
                  {activeTab === "passions" && <PassionsForm data={content.passions} onChange={(v) => updateField(["passions"], v)} />}
                  {activeTab === "gear" && <GearForm data={content.gear} onChange={(v) => updateField(["gear"], v)} />}
                  {activeTab === "contactData" && <ContactForm data={content.contactData} onChange={(v) => updateField(["contactData"], v)} />}
                </>
              )}
            </div>
          </div>

          {/* Preview Side */}
          {viewMode === "split" && (
            <div className="w-1/2 h-full bg-brand-bg overflow-y-auto relative">
              <div className="sticky top-0 left-0 w-full h-10 bg-brand-card/80 border-b border-brand-border flex items-center justify-center text-xs font-semibold text-brand-muted uppercase tracking-widest z-50 backdrop-blur-sm">
                Live Preview
              </div>
              <div className="p-8 pointer-events-none">
                {activeTab === "aboutMe" && <Hero data={content.aboutMe} />}
                {activeTab === "lab" && <Lab data={content.lab} />}
                {activeTab === "passions" && <Passions data={content.passions} />}
                {activeTab === "gear" && <Gear data={content.gear} />}
                {activeTab === "contactData" && <Contact data={content.contactData} />}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
