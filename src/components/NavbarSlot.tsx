"use client";

import { Navbar } from "@/components/Navbar";
import { usePathname } from "next/navigation";

export function NavbarSlot() {
  const pathname = usePathname();
  
  if (pathname?.startsWith("/admin")) {
    return null;
  }
  
  return <Navbar />;
}
