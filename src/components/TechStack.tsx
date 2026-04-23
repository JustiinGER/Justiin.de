"use client";

import { 
  SiUnraid, 
  SiProxmox, 
  SiDocker, 
  SiLinux, 
  SiNextcloud,
  SiJellyfin,
  SiHomeassistant,
  SiAdguard,
  SiBitwarden,
  SiPaperlessngx,
  SiPortainer,
  SiNginxproxymanager,
  SiWireguard,
  SiPterodactyl,
  SiNextdotjs, 
  SiTailwindcss, 
  SiTypescript, 
  SiGithub
} from "react-icons/si";

const techStack = [
  { name: "Unraid", icon: SiUnraid, color: "hover:text-[#F15A24]", url: "https://unraid.net/" },
  { name: "Proxmox", icon: SiProxmox, color: "hover:text-[#E57000]", url: "https://www.proxmox.com/" },
  { name: "Docker", icon: SiDocker, color: "hover:text-[#2496ED]", url: "https://www.docker.com/" },
  { name: "Linux", icon: SiLinux, color: "hover:text-[#FCC624]", url: "https://www.kernel.org/" },
  { name: "Nextcloud", icon: SiNextcloud, color: "hover:text-[#0082C9]", url: "https://nextcloud.com/" },
  { name: "Jellyfin", icon: SiJellyfin, color: "hover:text-[#00A4DC]", url: "https://jellyfin.org/" },
  { name: "Home Assistant", icon: SiHomeassistant, color: "hover:text-[#41BDF5]", url: "https://www.home-assistant.io/" },
  { name: "AdGuard", icon: SiAdguard, color: "hover:text-[#68BC71]", url: "https://adguard.com/en/adguard-home/overview.html" },
  { name: "Vaultwarden", icon: SiBitwarden, color: "hover:text-[#175DDC]", url: "https://github.com/dani-garcia/vaultwarden" },
  { name: "Paperless-ngx", icon: SiPaperlessngx, color: "hover:text-[#17541F]", url: "https://docs.paperless-ngx.com/" },
  { name: "Portainer", icon: SiPortainer, color: "hover:text-[#13BEF9]", url: "https://www.portainer.io/" },
  { name: "NPM", icon: SiNginxproxymanager, color: "hover:text-[#009639]", url: "https://nginxproxymanager.com/" },
  { name: "WireGuard", icon: SiWireguard, color: "hover:text-[#88171A]", url: "https://www.wireguard.com/" },
  { name: "Pterodactyl", icon: SiPterodactyl, color: "hover:text-[#0B5C92]", url: "https://pterodactyl.io/" },
  { name: "Next.js", icon: SiNextdotjs, color: "hover:text-slate-900 dark:hover:text-white", url: "https://nextjs.org/" },
  { name: "Tailwind", icon: SiTailwindcss, color: "hover:text-[#06B6D4]", url: "https://tailwindcss.com/" },
  { name: "TypeScript", icon: SiTypescript, color: "hover:text-[#3178C6]", url: "https://www.typescriptlang.org/" },
  { name: "GitHub", icon: SiGithub, color: "hover:text-slate-900 dark:hover:text-white", url: "https://github.com/" },
];

export function TechStack() {
  return (
    <section id="techstack" className="py-24 overflow-hidden bg-brand-card/30 border-t border-brand-border">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 mb-12 text-center">
        <h2 className="text-sm font-semibold text-brand-muted uppercase tracking-widest">
          Technologies & Tools
        </h2>
      </div>
      
      <div className="relative flex overflow-x-hidden group" aria-hidden="true">
        <div className="animate-marquee whitespace-nowrap flex items-center gap-16 py-4">
          {[...techStack, ...techStack, ...techStack].map((tech, i) => (
            <a 
              href={tech.url}
              target="_blank"
              rel="noopener noreferrer"
              key={`${tech.name}-${i}`} 
              className={`flex items-center gap-3 text-slate-500 opacity-60 transition-all duration-300 hover:opacity-100 ${tech.color}`}
              title={tech.name}
            >
              <tech.icon className="w-8 h-8" aria-label={`${tech.name} logo`} />
              <span className="font-medium text-lg hidden sm:block">{tech.name}</span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
