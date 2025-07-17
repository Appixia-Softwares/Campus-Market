import React, { useState } from "react";
import Link from "next/link";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Facebook, Twitter, Instagram, Mail, Info, Shield, HelpCircle, Users } from "lucide-react";

// Footer links and social icons
const footerLinks = [
  { href: "/about", label: "About", icon: Info },
  { href: "/contact", label: "Contact", icon: Mail },
  { href: "/privacy", label: "Privacy", icon: Shield },
  { href: "/help", label: "Help", icon: HelpCircle },
];

const socialLinks = [
  { href: "https://facebook.com", label: "Facebook", icon: Facebook },
  { href: "https://twitter.com", label: "Twitter", icon: Twitter },
  { href: "https://instagram.com", label: "Instagram", icon: Instagram },
];

// Main Footer component
const Footer: React.FC = () => {
  const [open, setOpen] = useState(false);
  const year = new Date().getFullYear();

  // Desktop footer
  const desktopFooter = (
    <footer className="hidden md:flex w-full border-t bg-background/80 backdrop-blur-lg text-foreground shadow-inner z-40 px-6 py-4 items-center justify-between">
      <div className="flex gap-6 items-center">
        {footerLinks.map(({ href, label, icon: Icon }) => (
          <Link key={href} href={href} className="flex items-center gap-1 text-muted-foreground hover:text-primary transition-colors text-sm font-medium">
            <Icon className="h-4 w-4" /> {label}
          </Link>
        ))}
      </div>
      <div className="flex gap-4 items-center">
        {socialLinks.map(({ href, label, icon: Icon }) => (
          <a key={href} href={href} target="_blank" rel="noopener noreferrer" aria-label={label} className="hover:text-primary text-muted-foreground transition-colors">
            <Icon className="h-5 w-5" />
          </a>
        ))}
      </div>
      <div className="text-xs text-muted-foreground ml-4">&copy; {year} Campus Marketplace. All rights reserved.</div>
    </footer>
  );

  // Mobile footer (bottom sheet)
  const mobileFooter = (
    <div className="md:hidden w-full flex items-center justify-center py-2 border-t bg-background/80 backdrop-blur-lg shadow-inner z-40">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <button
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary/90 text-white shadow-lg font-semibold text-sm focus:outline-none"
            aria-label="Open footer menu"
          >
            <Users className="h-4 w-4" />
            <span>More</span>
          </button>
        </SheetTrigger>
        <SheetContent side="bottom" className="rounded-t-2xl p-6">
          <div className="flex flex-col gap-4 items-center">
            <div className="flex gap-6 mb-2">
              {footerLinks.map(({ href, label, icon: Icon }) => (
                <Link key={href} href={href} className="flex flex-col items-center gap-1 text-muted-foreground hover:text-primary transition-colors text-xs font-medium">
                  <Icon className="h-5 w-5" />
                  {label}
                </Link>
              ))}
            </div>
            <div className="flex gap-4 mb-2">
              {socialLinks.map(({ href, label, icon: Icon }) => (
                <a key={href} href={href} target="_blank" rel="noopener noreferrer" aria-label={label} className="hover:text-primary text-muted-foreground transition-colors">
                  <Icon className="h-6 w-6" />
                </a>
              ))}
            </div>
            <div className="text-xs text-muted-foreground text-center">&copy; {year} Campus Market.<br />All rights reserved.</div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );

  return (
    <>
      {desktopFooter}
      {mobileFooter}
    </>
  );
};

export default Footer; 