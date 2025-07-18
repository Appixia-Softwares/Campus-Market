"use client";
import React, { useState } from "react";
import Link from "next/link";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Mail, Info, Shield, HelpCircle, Users, MapPin, TrendingUp, List, Folder, FileText, BarChart3, MessageCircle, Star, Briefcase, Newspaper, Download, BookOpen, UserCheck, Lock, Globe, FileWarning, Plus } from "lucide-react";
import { FaFacebook, FaInstagram, FaLinkedin, FaWhatsapp, FaEnvelope } from "react-icons/fa";

// Footer links and social icons
const aboutLinks = [
  { href: "/about", label: "About Us", icon: Info },
  { href: "/privacy", label: "Privacy Policy", icon: Shield },
];
// Platform, Resources, and Company links for footer navigation (including placeholders for future pages)
const platformLinks = [
  { href: "/marketplace", label: "Marketplace", icon: Folder },
  { href: "/marketplace/sell", label: "Sell Item", icon: Plus },
  { href: "/marketplace/favorites", label: "Favorites", icon: Star },
  { href: "/marketplace/my-listings", label: "My Listings", icon: List, disabled: false }, // Enable when page exists
  { href: "/marketplace?tab=trending", label: "Trending", icon: TrendingUp, disabled: false }, // Enable when tab/page exists
  { href: "/marketplace/categories", label: "Categories", icon: Folder, disabled: false }, // Enable when page exists
  { href: "/dashboard", label: "Dashboard", icon: BarChart3 },
  { href: "/verification", label: "Get Verified", icon: UserCheck },
  { href: "/messages", label: "Messages", icon: MessageCircle },
  { href: "/download", label: "Download App", icon: Download, disabled: true }, // Enable when page exists
];
const resourceLinks = [
  { href: "/help-center", label: "Help Center", icon: HelpCircle },
  { href: "/faqs", label: "FAQs", icon: Info, disabled: false }, // Enable when page exists
  { href: "/safety", label: "Safety Tips", icon: FileWarning, disabled: true }, // Enable when page exists
  { href: "/contact-us", label: "Contact", icon: Mail },
  { href: "/analytics", label: "Analytics", icon: BarChart3, disabled: true }, // Enable when page exists
  { href: "/reports", label: "Reports", icon: FileText, disabled: true }, // Enable when page exists
  { href: "/feedback", label: "Feedback", icon: MessageCircle, disabled: true }, // Enable when page exists
  { href: "/blog", label: "Blog", icon: BookOpen, disabled: true }, // Enable when page exists
  { href: "/news", label: "News", icon: Newspaper, disabled: true }, // Enable when page exists
  { href: "/community-guidelines", label: "Community Guidelines", icon: Globe, disabled: true }, // Enable when page exists
];
const companyLinks = [
  { href: "/about", label: "About Us", icon: Info },
  { href: "/privacy-policy", label: "Privacy Policy", icon: Lock },
  { href: "/terms", label: "Terms of Service", icon: FileText, disabled: true }, // Enable when page exists
  { href: "/careers", label: "Careers", icon: Briefcase, disabled: true }, // Enable when page exists
  { href: "/marketing", label: "Marketing", icon: TrendingUp, disabled: true}, // Enable when page exists
];
// Social links (use official brand icons)
const socialLinks = [
  { href: "https://www.facebook.com/profile.php?id=61575622615505", label: "Facebook", icon: FaFacebook },
  { href: "https://www.instagram.com/campusmarketzw", label: "Instagram", icon: FaInstagram },
  { href: "https://www.linkedin.com/company/campus-marketzw", label: "LinkedIn", icon: FaLinkedin },
  { href: "https://wa.me/+263786223289", label: "WhatsApp", icon: FaWhatsapp },
  { href: "mailto:suport@campusmarket.co.zw", label: "Email", icon: FaEnvelope },
];

// Desktop Footer
function DesktopFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="hidden md:block w-full border-t z-40 bg-gradient-to-tr from-green-50/80 via-white/80 to-green-100/80 dark:from-green-950/60 dark:via-background/80 dark:to-green-900/60 backdrop-blur-xl shadow-2xl">
      <div className="container mx-auto py-10 px-6 grid grid-cols-1 md:grid-cols-5 gap-8">
        {/* About Section */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <MapPin className="h-6 w-6 text-green-600 dark:text-green-400" />
            <span className="font-bold text-lg">Campus Marketplace</span>
          </div>
          <p className="text-sm text-muted-foreground mb-4">The ultimate marketplace for Zimbabwean university students.</p>
        </div>
        {/* Platform Links */}
        <div>
          <h3 className="font-semibold text-md mb-2 text-primary">Platform</h3>
          <ul className="flex flex-col gap-2">
            {platformLinks.map(({ href, label, icon: Icon, disabled }) => (
              <li key={href}>
                {disabled ? (
                  <span className="flex items-center gap-2 text-muted-foreground/50 cursor-not-allowed" title="Coming soon">
                    <Icon className="h-4 w-4" /> {label}
                  </span>
                ) : (
                  <Link href={href} className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors text-sm">
                    <Icon className="h-4 w-4" /> {label}
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </div>
        {/* Resources Links */}
        <div>
          <h3 className="font-semibold text-md mb-2 text-primary">Resources</h3>
          <ul className="flex flex-col gap-2">
            {resourceLinks.map(({ href, label, icon: Icon, disabled }) => (
              <li key={href}>
                {disabled ? (
                  <span className="flex items-center gap-2 text-muted-foreground/50 cursor-not-allowed" title="Coming soon">
                    <Icon className="h-4 w-4" /> {label}
                  </span>
                ) : (
                  <Link href={href} className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors text-sm">
                    <Icon className="h-4 w-4" /> {label}
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </div>
        {/* Company Links */}
        <div>
          <h3 className="font-semibold text-md mb-2 text-primary">Company</h3>
          <ul className="flex flex-col gap-2">
            {companyLinks.map(({ href, label, icon: Icon, disabled }) => (
              <li key={href}>
                {disabled ? (
                  <span className="flex items-center gap-2 text-muted-foreground/50 cursor-not-allowed" title="Coming soon">
                    <Icon className="h-4 w-4" /> {label}
                  </span>
                ) : (
                  <Link href={href} className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors text-sm">
                    <Icon className="h-4 w-4" /> {label}
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </div>
        {/* Social Section */}
        <div>
          <h3 className="font-semibold text-md mb-2 text-primary">Connect</h3>
          <div className="flex gap-4 mb-4">
            {socialLinks.map(({ href, label, icon: Icon }) => (
              <a key={href} href={href} target="_blank" rel="noopener noreferrer" aria-label={label} className="hover:text-primary text-muted-foreground transition-colors">
                <Icon className="h-6 w-6" />
              </a>
            ))}
          </div>
          <div className="text-xs text-muted-foreground">Made with <span className="text-red-500">♥</span> in Zimbabwe</div>
        </div>
      </div>
      <div className="text-center text-xs text-muted-foreground py-4 border-t">&copy; {year} Campus Marketplace. All rights reserved.</div>
    </footer>
  );
}

// Mobile Footer (Bottom Sheet)
function MobileFooter() {
  const [open, setOpen] = useState(false);
  const year = new Date().getFullYear();
  return (
    <div className="md:hidden w-full flex items-center justify-center py-2 border-t bg-gradient-to-tr from-green-50/80 via-white/80 to-green-100/80 dark:from-green-950/60 dark:via-background/80 dark:to-green-900/60 backdrop-blur-xl shadow-2xl z-40">
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
          <div className="flex flex-col gap-6 items-center">
            <div className="grid grid-cols-2 gap-4 w-full max-w-xs">
              <div>
                <h4 className="font-semibold text-sm mb-2 text-primary">Platform</h4>
                <ul className="flex flex-col gap-2">
                  {platformLinks.map(({ href, label, icon: Icon, disabled }) => (
                    <li key={href}>
                      {disabled ? (
                        <span className="flex items-center gap-2 text-muted-foreground/50 cursor-not-allowed" title="Coming soon">
                          <Icon className="h-4 w-4" /> {label}
                        </span>
                      ) : (
                        <Link href={href} className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors text-xs">
                          <Icon className="h-4 w-4" /> {label}
                        </Link>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-sm mb-2 text-primary">Resources</h4>
                <ul className="flex flex-col gap-2">
                  {resourceLinks.map(({ href, label, icon: Icon, disabled }) => (
                    <li key={href}>
                      {disabled ? (
                        <span className="flex items-center gap-2 text-muted-foreground/50 cursor-not-allowed" title="Coming soon">
                          <Icon className="h-4 w-4" /> {label}
                        </span>
                      ) : (
                        <Link href={href} className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors text-xs">
                          <Icon className="h-4 w-4" /> {label}
                        </Link>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-2 w-full max-w-xs">
              <h4 className="font-semibold text-sm mb-2 text-primary">Company</h4>
              <ul className="flex flex-col gap-2">
                {companyLinks.map(({ href, label, icon: Icon, disabled }) => (
                  <li key={href}>
                    {disabled ? (
                      <span className="flex items-center gap-2 text-muted-foreground/50 cursor-not-allowed" title="Coming soon">
                        <Icon className="h-4 w-4" /> {label}
                      </span>
                    ) : (
                      <Link href={href} className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors text-xs">
                        <Icon className="h-4 w-4" /> {label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex gap-6">
              {socialLinks.map(({ href, label, icon: Icon }) => (
                <a key={href} href={href} target="_blank" rel="noopener noreferrer" aria-label={label} className="hover:text-primary text-muted-foreground transition-colors">
                  <Icon className="h-7 w-7" />
                </a>
              ))}
            </div>
            <div className="text-xs text-muted-foreground text-center">Made with <span className="text-red-500">♥</span> in Zimbabwe<br />&copy; {year} Campus Marketplace.</div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

// Main Footer component
const Footer: React.FC = () => (
  <>
    <DesktopFooter />
    <MobileFooter />
  </>
);

export default Footer; 