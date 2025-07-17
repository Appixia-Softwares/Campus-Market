import React, { useState } from "react";
import Link from "next/link";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Facebook, Twitter, Instagram, Mail, Info, Shield, HelpCircle, Users, Send, MapPin } from "lucide-react";

// Footer links and social icons
const aboutLinks = [
  { href: "/about", label: "About Us", icon: Info },
  { href: "/privacy", label: "Privacy Policy", icon: Shield },
];
// Platform, Resources, and Company links for footer navigation
const platformLinks = [
  { href: "/marketplace", label: "Marketplace" },
  { href: "/marketplace/sell", label: "Sell Item" },
  { href: "/marketplace/favorites", label: "Favorites" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/verification", label: "Get Verified" },
  { href: "/messages", label: "Messages" },
];
const resourceLinks = [
  { href: "/help", label: "Help Center" },
  // { href: "/faq", label: "FAQs" }, // Uncomment if /faq exists
  // { href: "/safety", label: "Safety Tips" }, // Uncomment if /safety exists
  { href: "/contact", label: "Contact" },
];
const companyLinks = [
  { href: "/about", label: "About Us" },
  { href: "/privacy", label: "Privacy Policy" },
];
const socialLinks = [
  { href: "https://facebook.com", label: "Facebook", icon: Facebook },
  { href: "https://twitter.com", label: "Twitter", icon: Twitter },
  { href: "https://instagram.com", label: "Instagram", icon: Instagram },
];

// Newsletter signup mock
function NewsletterSignup() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<null | "success" | "error">(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      if (email.includes("@")) {
        setStatus("success");
      } else {
        setStatus("error");
      }
      setLoading(false);
    }, 1000);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2 w-full max-w-xs">
      <label htmlFor="newsletter" className="text-xs font-semibold text-muted-foreground">Subscribe to our newsletter</label>
      <div className="flex gap-2">
        <input
          id="newsletter"
          type="email"
          value={email}
          onChange={e => { setEmail(e.target.value); setStatus(null); }}
          placeholder="Your email"
          className="flex-1 rounded-lg border px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none bg-background/80"
          required
        />
        <button
          type="submit"
          className="rounded-lg bg-primary text-white px-3 py-2 flex items-center gap-1 font-semibold hover:bg-primary/90 transition"
          disabled={loading}
        >
          <Send className="h-4 w-4" />
          {loading ? "..." : "Join"}
        </button>
      </div>
      {status === "success" && <span className="text-green-600 text-xs">Thank you for subscribing!</span>}
      {status === "error" && <span className="text-red-600 text-xs">Please enter a valid email.</span>}
    </form>
  );
}

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
          <NewsletterSignup />
        </div>
        {/* Platform Links */}
        <div>
          <h3 className="font-semibold text-md mb-2 text-primary">Platform</h3>
          <ul className="flex flex-col gap-2">
            {platformLinks.map(({ href, label }) => (
              <li key={href}>
                <Link href={href} className="text-muted-foreground hover:text-primary transition-colors text-sm">
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        {/* Resources Links */}
        <div>
          <h3 className="font-semibold text-md mb-2 text-primary">Resources</h3>
          <ul className="flex flex-col gap-2">
            {resourceLinks.map(({ href, label }) => (
              <li key={href}>
                <Link href={href} className="text-muted-foreground hover:text-primary transition-colors text-sm">
                  {label}
                </Link>
              </li>
            ))}
            {/* <li><Link href="/faq" className="text-muted-foreground hover:text-primary transition-colors text-sm">FAQs</Link></li> */}
            {/* <li><Link href="/safety" className="text-muted-foreground hover:text-primary transition-colors text-sm">Safety Tips</Link></li> */}
          </ul>
        </div>
        {/* Company Links */}
        <div>
          <h3 className="font-semibold text-md mb-2 text-primary">Company</h3>
          <ul className="flex flex-col gap-2">
            {companyLinks.map(({ href, label }) => (
              <li key={href}>
                <Link href={href} className="text-muted-foreground hover:text-primary transition-colors text-sm">
                  {label}
                </Link>
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
                  {platformLinks.map(({ href, label }) => (
                    <li key={href}>
                      <Link href={href} className="text-muted-foreground hover:text-primary transition-colors text-xs">
                        {label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-sm mb-2 text-primary">Resources</h4>
                <ul className="flex flex-col gap-2">
                  {resourceLinks.map(({ href, label }) => (
                    <li key={href}>
                      <Link href={href} className="text-muted-foreground hover:text-primary transition-colors text-xs">
                        {label}
                      </Link>
                    </li>
                  ))}
                  {/* <li><Link href="/faq" className="text-muted-foreground hover:text-primary transition-colors text-xs">FAQs</Link></li> */}
                  {/* <li><Link href="/safety" className="text-muted-foreground hover:text-primary transition-colors text-xs">Safety Tips</Link></li> */}
                </ul>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-2 w-full max-w-xs">
              <h4 className="font-semibold text-sm mb-2 text-primary">Company</h4>
              <ul className="flex flex-col gap-2">
                {companyLinks.map(({ href, label }) => (
                  <li key={href}>
                    <Link href={href} className="text-muted-foreground hover:text-primary transition-colors text-xs">
                      {label}
                    </Link>
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
            <NewsletterSignup />
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