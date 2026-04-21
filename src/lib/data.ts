export interface AboutMe {
  title: string;
  tagline: string;
  quickFacts: string[];
  bio: string[];
}

export const aboutMe: AboutMe = {
  title: "01. About Me",
  tagline: "Precision by trade, curiosity by nature. I maintain systems during the day and explore the world — digital and physical — after hours.",
  quickFacts: ["Germany", "Homelab runner", "Amateur astrophotographer", "Birdwatcher"],
  bio: [
    "Hello. I'm Justin — an IT System Technician who feels at home in server rooms as much as in open fields. I spend my working hours keeping complex infrastructure running: networks, systems, and all the invisible plumbing that makes modern IT work.",
    "Outside of work, I'm deeply invested in the self-hosting community. My homelab is always running something new — whether that's the latest release of a privacy-respecting cloud alternative or a niche monitoring stack I stumbled across on GitHub. I believe in owning your data and understanding how your tools actually work.",
    "When I step away from screens, I take a telescope outside and look for faint nebulas and galaxies. I track planes overhead with FlightRadar24 and sometimes head to the airport just to watch them land. I keep a bird list and find genuine peace in noticing what's actually living around me. I enjoy driving and the engineering behind cars. Nature, hiking, and open landscapes reset me.",
    "Coding ties it all together — small scripts that automate the repetitive, tools that scratch my own itch, and the occasional weekend project that goes deeper than expected."
  ]
};

export interface Equipment {
  label: string;
  value: string;
  tooltip?: string;
}

export interface Tag {
  name: string;
  tooltip?: string;
}

export interface PassionItem {
  id: string;
  title: string;
  featured?: boolean;
  icon: string;
  content: string;
  tags?: (string | Tag)[];
  equipment?: Equipment[];
  className: string;
  color: string;
  bgColor: string;
}

export interface Passions {
  title: string;
  subtitle: string;
  items: PassionItem[];
}

export const passions: Passions = {
  title: "03. Passions & Pursuits",
  subtitle: "The things that pull me away from the keyboard — and sometimes back toward it.",
  items: [
    {
      id: "astrophotography",
      title: "Space & Astrophotography",
      featured: true,
      icon: "Star",
      content: "On clear nights I point my smart telescope at things you can't see with the naked eye — the Orion Nebula's dusty pillars, the Andromeda Galaxy's faint outer arms, open clusters that look like scattered salt on black velvet.\n\nI shoot with a Dwarflab Dwarf 3 and a Dwarf Mini — compact smart scopes that handle auto-tracking, stacking, and alignment. Long exposures, live stacking, and post-processing turn hours of patience into images that make the scale of the universe feel tangible.\n\nBeyond capturing the cosmos, I am deeply fascinated by human space exploration. Following the missions of NASA and ESA, and watching humanity push the boundaries of what's possible, fuels my curiosity about our future among the stars.",
      tags: [
        { name: "Dwarflab Dwarf 3", tooltip: "Smart telescope for deep sky imaging" },
        { name: "Dwarf Mini", tooltip: "Compact smart telescope for astrophotography" },
        { name: "Deep Sky Objects", tooltip: "Nebulas, galaxies, and star clusters" }, 
        { name: "Live Stacking", tooltip: "Combining multiple exposures in real-time" },
        { name: "NASA / ESA", tooltip: "Space agencies" },
        { name: "Space Exploration", tooltip: "Discovery of celestial structures" }
      ],
      equipment: [
        { label: "Primary", value: "Dwarflab Dwarf 3", tooltip: "Smart telescope for deep sky imaging" },
        { label: "Secondary", value: "Dwarf Mini", tooltip: "Compact smart telescope for astrophotography" }
      ],
      className: "md:col-span-12 lg:col-span-8",
      color: "text-brand-accent",
      bgColor: "bg-brand-accent/10"
    },
    {
      id: "coding",
      title: "Coding",
      icon: "Code",
      content: "Writing scripts and small tools that scratch my own itch. Automating tedious tasks, building homelab utilities, and occasionally going down rabbit holes that turn into weekend projects.",
      tags: [
        { name: "Python", tooltip: "High-level programming language" },
        { name: "Bash", tooltip: "Unix shell and command language" },
        { name: "TypeScript", tooltip: "Strongly typed superset of JavaScript" }
      ],
      className: "md:col-span-12 lg:col-span-4",
      color: "text-brand-accent",
      bgColor: "bg-brand-accent/10"
    },
    {
      id: "self-hosting",
      title: "Self-Hosting & Homelab",
      icon: "Server",
      content: "Why rent when you can own? I host my entire personal infrastructure—from media streaming and secure photo backups to password management and network-wide ad blocking. If there's a solid open-source alternative to Big Tech, it's likely spinning in a container on my network.\n\nThe lab is an ever-evolving ecosystem. At its core is a Ugreen DXP6800 Pro (96 GB RAM · 3 TB NVMe · 58 TB HDD) serving as the main storage and services backbone. A Minisforum UM790 Pro (64 GB RAM · 4 TB NVMe) handles the compute-heavy workloads, while a Dell Wyse 5070 quietly manages ADS-B tracking and audio processing. It's a never-ending cycle of deploying new containers, fine-tuning configs, and the inevitable 2 AM troubleshooting sessions.",
      tags: [
        { name: "Nextcloud", tooltip: "Self-hosted productivity platform and file sync" }, 
        { name: "Jellyfin", tooltip: "Open-source media server" }, 
        { name: "Home Assistant", tooltip: "Open-source home automation platform" }, 
        { name: "Portainer", tooltip: "Container management UI" }, 
        { name: "Nginx Proxy Manager", tooltip: "Reverse proxy with Let's Encrypt support" }, 
        { name: "AdGuard Home", tooltip: "Network-wide ad blocking and DNS server" }
      ],
      className: "md:col-span-12 lg:col-span-7",
      color: "text-brand-accent",
      bgColor: "bg-brand-accent/10"
    },
    {
      id: "gaming",
      title: "Gaming",
      icon: "Gamepad2",
      content: "Co-op sessions, long-haul trucking in Euro Truck Simulator 2, lapping circuits in Forza Motorsport, cruising open worlds in Forza Horizon, and building cities in Anno. Games where systems matter and there's always something to optimize.",
      tags: [
        { name: "Euro Truck Simulator 2", tooltip: "Vehicle simulation game" },
        { name: "Forza Motorsport", tooltip: "Sim racing video game" },
        { name: "Anno", tooltip: "Real-time strategy and city-building game series" },
        { name: "Co-op", tooltip: "Cooperative multiplayer gaming" }
      ],
      className: "md:col-span-12 lg:col-span-5",
      color: "text-brand-accent",
      bgColor: "bg-brand-accent/10"
    },
    {
      id: "aviation",
      title: "Aviation & ADS-B",
      icon: "Plane",
      content: "I run my own ADS-B receiver station and feed real-time aircraft data to Flightradar24, AirNav, ADS-B Exchange, and others. Setup: Airspy Mini SDR + Uputronics LNA + cavity filter + roof antenna — picking up traffic from hundreds of kilometers out.",
      tags: [
        { name: "Airspy Mini", tooltip: "High performance SDR receiver for ADS-B" },
        { name: "Uputronics LNA", tooltip: "Low Noise Amplifier to boost weak signals" },
        { name: "Cavity Filter", tooltip: "Filters out RF interference (e.g. GSM/LTE)" },
        { name: "ADS-B Exchange", tooltip: "Unfiltered flight data network" }, 
        { name: "Flightradar24", tooltip: "Global flight tracking service" }
      ],
      className: "md:col-span-6 lg:col-span-6",
      color: "text-brand-accent",
      bgColor: "bg-brand-accent/10"
    },
    {
      id: "birdwatching",
      title: "Birdwatching",
      icon: "Bird",
      content: "I run a fully automated bird detection stack: Bird Buddy smart feeder for visual ID, Birdweather PUC for passive call recording, and BirdNET-Go with a Focusrite Scarlett 2i2 and Clippy XLR EM272Z1 mic for high-quality acoustic monitoring.",
      tags: [
        { name: "Bird Buddy", tooltip: "Smart bird feeder with camera" }, 
        { name: "Birdweather PUC", tooltip: "Passive acoustic monitoring device for bird calls" }, 
        { name: "BirdNET-Go", tooltip: "Acoustic bird classification system" }, 
        { name: "EM272Z1", tooltip: "Ultra low-noise omnidirectional microphone (Clippy XLR)" },
        { name: "Scarlett 2i2", tooltip: "High-quality USB audio interface" }
      ],
      className: "md:col-span-6 lg:col-span-6",
      color: "text-brand-accent",
      bgColor: "bg-brand-accent/10"
    },
    {
      id: "nature",
      title: "Nature & Hiking",
      icon: "Leaf",
      content: "Walking through forests or along ridgelines resets something the desk drains. I pay attention to what's growing, what's moving, and what sounds like what.",
      tags: [
        { name: "Hiking", tooltip: "Walking in natural environments" },
        { name: "Forests", tooltip: "Woodland ecosystems" },
        { name: "Wildlife", tooltip: "Non-domesticated animal species" }
      ],
      className: "md:col-span-6 lg:col-span-6",
      color: "text-brand-accent",
      bgColor: "bg-brand-accent/10"
    },
    {
      id: "cars",
      title: "Cars & Motorsport",
      icon: "Car",
      content: "I appreciate thoughtful automotive engineering — the balance of mechanics, safety systems, and design. Road trips, engine sounds, and the engineering decisions behind modern vehicles.\n\nI am also a passionate motorsport enthusiast. Whether it's the grueling endurance races of Le Mans and Daytona, the sheer bravery of the Isle of Man TT, or the legendary Nürburgring Nordschleife — racing represents the ultimate test of human skill and machine.",
      tags: [
        { name: "Nürburgring", tooltip: "Legendary motorsport complex in Germany" },
        { name: "Le Mans", tooltip: "24 Hours of Le Mans endurance race" },
        { name: "Daytona", tooltip: "Daytona International Speedway" },
        { name: "Isle of Man TT", tooltip: "Annual motorcycle racing event" },
        { name: "Engineering", tooltip: "Automotive and mechanical design" }
      ],
      className: "md:col-span-6 lg:col-span-6",
      color: "text-brand-accent",
      bgColor: "bg-brand-accent/10"
    },
    {
      id: "building-blocks",
      title: "Building Blocks",
      icon: "Boxes",
      content: "Connecting pieces, following complex instructions, and seeing a structure come to life. I enjoy building intricate sets from various manufacturers, appreciating the mechanical design and creativity behind each model.",
      tags: [
        { name: "LEGO", tooltip: "Plastic construction toys" },
        { name: "BlueBrixx", tooltip: "Alternative building block brand" },
        { name: "CaDA", tooltip: "Technic-style building block brand" },
        { name: "Architecture", tooltip: "Scale models of famous buildings" },
        { name: "Technic", tooltip: "Advanced mechanical building sets" }
      ],
      className: "md:col-span-6 lg:col-span-6",
      color: "text-brand-accent",
      bgColor: "bg-brand-accent/10"
    },
    {
      id: "taxidermy",
      title: "Taxidermy & Entomology",
      icon: "Bug",
      content: "Preserving and admiring the delicate, intricate beauty of nature. My collection includes carefully framed butterflies, showcasing the incredible patterns, vibrant colors, and fragile anatomy found in entomology.",
      tags: [
        { name: "Framed Butterflies", tooltip: "Preserved butterfly specimens" },
        { name: "Taxidermy", tooltip: "Preserving an animal's body via mounting or stuffing" },
        { name: "Entomology", tooltip: "Scientific study of insects" },
        { name: "Preservation", tooltip: "Maintaining specimens for study and display" }
      ],
      className: "md:col-span-6 lg:col-span-6",
      color: "text-brand-accent",
      bgColor: "bg-brand-accent/10"
    }
  ]
};

export interface ServerSpec {
  label: string;
  value: string;
}

export interface LabServer {
  id: string;
  name: string;
  os: string;
  role: string;
  osColor: string;
  osBg: string;
  specs: ServerSpec[];
  services: (string | Tag)[];
}

export interface Lab {
  title: string;
  subtitle: string;
  servers: LabServer[];
}

export const lab: Lab = {
  title: "02. The Lab",
  subtitle: "My home infrastructure — where ideas are deployed, data stays private, and something is always running.",
  servers: [
    {
      id: "ugreen",
      name: "Ugreen DXP6800 Pro",
      os: "Unraid OS",
      role: "Media & Storage Node",
      osColor: "text-orange-400",
      osBg: "bg-orange-500/10",
      specs: [
        { label: "RAM", value: "96 GB" },
        { label: "HDD", value: "58 TB" },
        { label: "NVMe", value: "3 TB" },
      ],
      services: [
        { name: "Proxmox Backup Server", tooltip: "Enterprise backup solution for Proxmox VE" },
        { name: "Jellyfin", tooltip: "Open-source media server" },
        { name: "Nextcloud", tooltip: "Self-hosted productivity platform and file sync" },
        { name: "Adguard-Home", tooltip: "Network-wide ad blocking and DNS server" },
        { name: "Paperless-NGX", tooltip: "Digital document management system" },
        { name: "Vaultwarden", tooltip: "Self-hosted Bitwarden-compatible password manager" }
      ],
    },
    {
      id: "minisforum",
      name: "Minisforum UM790 Pro",
      os: "Proxmox VE",
      role: "Virtualization & Services",
      osColor: "text-red-400",
      osBg: "bg-red-500/10",
      specs: [
        { label: "RAM", value: "64 GB" },
        { label: "NVMe", value: "4 TB" },
      ],
      services: [
        { name: "Portainer", tooltip: "Container management UI" },
        { name: "Home Assistant OS", tooltip: "Open-source home automation platform" },
        { name: "Pterodactyl Panel", tooltip: "Game server management panel" },
        { name: "Pterodactyl Wings", tooltip: "Game server management panel" },
        { name: "Nginx", tooltip: "High-performance web server and reverse proxy" },
        { name: "Wireguard VPN Server", tooltip: "Fast, modern, secure VPN tunnel" }
      ],
    },
    {
      id: "dell-wyse",
      name: "Dell Wyse 5070",
      os: "DietPi",
      role: "ADS-B & Audio Node",
      osColor: "text-purple-400",
      osBg: "bg-purple-500/10",
      specs: [
        { label: "RAM", value: "8 GB" },
        { label: "SSD", value: "60 GB" },
      ],
      services: [
        { name: "BirdNET-Go", tooltip: "Acoustic bird classification system" },
        { name: "ADS-B Stack", tooltip: "Flight tracking software stack" }
      ],
    },
  ],
};
