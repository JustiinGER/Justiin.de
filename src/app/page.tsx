import dynamic from "next/dynamic";
import { Hero } from "@/components/Hero";

const Lab = dynamic(() => import("@/components/Lab").then(m => ({ default: m.Lab })), {
  loading: () => <div className="min-h-screen animate-pulse bg-brand-card/20" />,
});
const Passions = dynamic(() => import("@/components/Passions").then(m => ({ default: m.Passions })), {
  loading: () => <div className="min-h-screen animate-pulse bg-brand-card/20" />,
});
const Gear = dynamic(() => import("@/components/Gear").then(m => ({ default: m.Gear })), {
  loading: () => <div className="min-h-screen animate-pulse bg-brand-card/20" />,
});
const TechStack = dynamic(() => import("@/components/TechStack").then(m => ({ default: m.TechStack })), {
  loading: () => <div className="min-h-[50vh] animate-pulse bg-brand-card/20" />,
});
const Contact = dynamic(() => import("@/components/Contact").then(m => ({ default: m.Contact })), {
  loading: () => <div className="min-h-[50vh] animate-pulse bg-brand-card/20" />,
});

export default function Home() {
  return (
    <main className="flex flex-col">
      <Hero />
      <Lab />
      <Passions />
      <Gear />
      <Contact />
      <TechStack />
    </main>
  );
}
