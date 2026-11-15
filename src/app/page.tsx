import dynamic from "next/dynamic";
import { Hero } from "@/components/Hero";
import { getAllContent } from "@/lib/content.server";

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

export const revalidate = 60; // Revalidate the page every 60 seconds

export default async function Home() {
  const content = await getAllContent();

  // Lab is a Client Component, so its props end up in the HTML. Internal
  // addresses are only needed server-side by /api/ping and must not ship.
  const publicLab = {
    ...content.lab,
    servers: content.lab.servers.map((server) => {
      const { ip, ...publicServer } = server;
      void ip;
      return publicServer;
    }),
  };

  return (
    <main id="main" className="flex flex-col">
      <Hero data={content.aboutMe} />
      <Lab data={publicLab} />
      <Passions data={content.passions} />
      <Gear data={content.gear} />
      <Contact data={content.contactData} />
      <TechStack />
    </main>
  );
}
