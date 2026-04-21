import { Hero } from "@/components/Hero";
import { Lab } from "@/components/Lab";
import { Passions } from "@/components/Passions";
import { TechStack } from "@/components/TechStack";
import { Gear } from "@/components/Gear";

export default function Home() {
  return (
    <main className="flex flex-col">
      <Hero />
      <Lab />
      <Passions />
      <Gear />
      <TechStack />
    </main>
  );
}
