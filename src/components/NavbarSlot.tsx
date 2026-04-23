"use client";

import { usePathname } from "next/navigation";
import { Navbar } from "@/components/Navbar";

export function NavbarSlot() {
  const pathname = usePathname();

  if (pathname === "/privacy") {
    return null;
  }

  return <Navbar />;
}
