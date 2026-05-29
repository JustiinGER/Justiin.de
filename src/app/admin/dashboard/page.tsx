"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  LogOut, LayoutDashboard, User, Server, Heart, 
  Cpu, Link as LinkIcon, Save, Loader2, Check, AlertCircle,
  Plus, Trash2
} from "lucide-react";
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
  const [activeTab, setActiveTab] = useState<Tab>("aboutMe");
  const [viewMode, setViewMode] = useState<"form" | "json" | "split">("split");
  const [content, setContent] = useState<SiteContent | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">("idle");
  const [savedContentStrings, setSavedContentStrings] = useState<Record<string, string>>({});

  useEffect(() => {
    const token = sessionStorage.getItem("admin_token");
    if (!token) {
      router.push("/admin");
      return;
    }

    fetch("/api/admin/content", {
      headers: { Authorization: `Bearer ${token}` }
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
  }, [router]);

  const handleLogout = () => {
    sessionStorage.removeItem("admin_token");
    router.push("/admin");
  };

  const handleSave = useCallback(async () => {
    if (!content) return;
    
    setIsSaving(true);
    setSaveStatus("idle");
    const token = sessionStorage.getItem("admin_token");
    
    try {
      const res = await fetch("/api/admin/content", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
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
  }, [content, activeTab]);

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
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <Loader2 className="w-8 h-8 text-brand-accent animate-spin" />
      </div>
    );
  }

  if (!content) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950">
        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
        <h2 className="text-xl font-semibold text-white">Failed to load content</h2>
        <button onClick={handleLogout} className="mt-4 text-brand-accent hover:underline">Return to Login</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex">
      {/* Sidebar */}
      <aside className="w-64 border-r border-slate-800 bg-slate-900/50 flex flex-col">
        <div className="p-6 border-b border-slate-800 flex items-center gap-3">
          <div className="w-8 h-8 bg-brand-accent/20 text-brand-accent rounded-lg flex items-center justify-center">
            <LayoutDashboard className="w-4 h-4" />
          </div>
          <span className="font-semibold text-white tracking-wide">Dashboard</span>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
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
                    : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-brand-accent" : "text-slate-500"}`} />
                <span className="flex-1 text-left">{tab.label}</span>
                {isDirty && (
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse shrink-0" />
                )}
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-all"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="h-20 border-b border-slate-800 bg-slate-900/30 flex items-center justify-between px-8 backdrop-blur-md">
          <div className="flex items-center gap-6">
            <h1 className="text-xl font-semibold text-white flex items-center gap-2">
              Editing: <span className="text-brand-accent">{tabs.find(t => t.id === activeTab)?.label}</span>
            </h1>
            
            <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-1">
              <button
                onClick={() => setViewMode("form")}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${viewMode === "form" ? "bg-slate-800 text-white shadow-sm" : "text-slate-400 hover:text-slate-200"}`}
              >
                Form
              </button>
              <button
                onClick={() => setViewMode("json")}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${viewMode === "json" ? "bg-slate-800 text-white shadow-sm" : "text-slate-400 hover:text-slate-200"}`}
              >
                JSON
              </button>
              <button
                onClick={() => setViewMode("split")}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${viewMode === "split" ? "bg-slate-800 text-white shadow-sm" : "text-slate-400 hover:text-slate-200"}`}
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
              <span className="text-xs text-slate-600 hidden lg:block select-none">Ctrl+S</span>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="relative flex items-center gap-2 px-5 py-2.5 bg-brand-accent hover:bg-brand-accent/90 text-slate-950 font-semibold rounded-xl transition-all disabled:opacity-50"
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
          <div className={`${viewMode === "split" ? "w-1/2 border-r border-slate-800" : "w-full"} h-full overflow-y-auto p-8`}>
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
                    <div className="space-y-6">
                      <Field label="Title" value={content.aboutMe.title} onChange={v => updateField(["aboutMe", "title"], v)} />
                      <Field label="Tagline" type="textarea" value={content.aboutMe.tagline} onChange={v => updateField(["aboutMe", "tagline"], v)} />
                      
                      <div className="space-y-3">
                        <label className="block text-sm font-medium text-slate-300">Quick Facts (comma separated)</label>
                        <input
                          type="text"
                          value={content.aboutMe.quickFacts.join(", ")}
                          onChange={(e) => updateField(["aboutMe", "quickFacts"], e.target.value.split(",").map(s => s.trim()))}
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-brand-accent/50"
                        />
                      </div>

                      <div className="space-y-3">
                        <label className="block text-sm font-medium text-slate-300">Bio Paragraphs</label>
                        {content.aboutMe.bio.map((p, i) => (
                          <div key={i} className="relative group">
                            <textarea
                              value={p}
                              onChange={(e) => updateField(["aboutMe", "bio", i.toString()], e.target.value)}
                              rows={3}
                              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 pr-10 text-white focus:outline-none focus:ring-2 focus:ring-brand-accent/50"
                            />
                            {content.aboutMe.bio.length > 1 && (
                              <button
                                onClick={() => updateField(["aboutMe", "bio"], content.aboutMe.bio.filter((_, idx) => idx !== i))}
                                className="absolute top-2 right-2 p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 opacity-0 group-hover:opacity-100 transition-all"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        ))}
                        <button
                          onClick={() => updateField(["aboutMe", "bio"], [...content.aboutMe.bio, ""])}
                          className="mt-2 w-full py-4 border-2 border-dashed border-slate-700 hover:border-brand-accent/50 rounded-2xl flex items-center justify-center gap-2 text-slate-400 hover:text-brand-accent transition-colors"
                        >
                          <Plus className="w-5 h-5" /> Add Paragraph
                        </button>
                      </div>
                    </div>
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
            <div className="w-1/2 h-full bg-slate-950 overflow-y-auto relative">
              <div className="sticky top-0 left-0 w-full h-10 bg-slate-900/80 border-b border-slate-800 flex items-center justify-center text-xs font-semibold text-slate-500 uppercase tracking-widest z-50 backdrop-blur-sm">
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

function Field({ label, value, onChange, type = "text" }: { label: string, value: string, onChange: (v: string) => void, type?: "text" | "textarea" }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-slate-300">{label}</label>
      {type === "textarea" ? (
        <textarea
          value={value}
          onChange={e => onChange(e.target.value)}
          rows={3}
          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-brand-accent/50"
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={e => onChange(e.target.value)}
          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-brand-accent/50"
        />
      )}
    </div>
  );
}
