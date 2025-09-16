"use client"

import { motion } from "framer-motion"
import { 
  Mail, 
  Phone, 
  MapPin, 
  Clock, 
  Star,
  Users,
  TrendingUp,
  Shield,
  Gift,
  Zap,
  ArrowRight,
  CheckCircle,
  Heart
} from "lucide-react"
import { FaFacebook, FaInstagram, FaLinkedin, FaWhatsapp, FaTwitter } from "react-icons/fa"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"

const features = [
  { icon: <Shield className="h-4 w-4" />, text: "100% Secure" },
  { icon: <Users className="h-4 w-4" />, text: "Verified Students" },
  { icon: <TrendingUp className="h-4 w-4" />, text: "Zero Fees" },
  { icon: <Clock className="h-4 w-4" />, text: "24/7 Support" }
]

const quickLinks = [
  { name: "About Us", href: "/about" },
  { name: "How It Works", href: "/how-it-works" },
  { name: "Safety Tips", href: "/safety-tips" },
  { name: "Help Center", href: "/help-center" },
  { name: "Contact", href: "/contact" },
  { name: "Privacy Policy", href: "/privacy-policy" }
]

const socialLinks = [
  { name: "Facebook", icon: FaFacebook, href: "https://www.facebook.com/profile.php?id=61575622615505" },
  { name: "Instagram", icon: FaInstagram, href: "https://www.instagram.com/campusmarketzw" },
  { name: "LinkedIn", icon: FaLinkedin, href: "https://www.linkedin.com/company/campus-marketzw" },
  { name: "WhatsApp", icon: FaWhatsapp, href: "https://wa.me/+263786223289" },
  { name: "Twitter", icon: FaTwitter, href: "https://twitter.com/campusmarketzw" }
]

export default function EnhancedFooter() {
  return (
    <footer className="bg-gradient-to-b from-background to-muted/20 border-t">
      {/* Main Footer Content */}
      <div className="container mx-auto px-4 py-16">
        <div className="grid lg:grid-cols-4 md:grid-cols-2 gap-8">
          {/* Brand & Subscription Section */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <div className="flex items-center gap-2 mb-6">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-green-500 to-blue-500 flex items-center justify-center">
                  <span className="text-white font-bold text-lg">CM</span>
                </div>
                <span className="text-2xl font-bold">Campus Marketplace</span>
              </div>
              
              <p className="text-muted-foreground mb-6 max-w-md">
                Zimbabwe's premier student marketplace. Buy, sell, and connect with verified students across 15+ universities.
              </p>

              {/* Subscription CTA */}
              <Card className="mb-8 bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-950/50 dark:to-blue-950/50 border-green-200 dark:border-green-800">
                <CardContent className="p-6">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    viewport={{ once: true }}
                    className="text-center"
                  >
                    <motion.div
                      animate={{ 
                        scale: [1, 1.05, 1],
                        rotate: [0, 2, -2, 0]
                      }}
                      transition={{ 
                        duration: 3, 
                        repeat: Infinity, 
                        repeatType: "reverse" 
                      }}
                      className="inline-flex items-center gap-2 mb-4"
                    >
                      <Gift className="h-5 w-5 text-green-600 dark:text-green-400" />
                      <span className="font-semibold text-green-700 dark:text-green-300">
                        Join the Waitlist
                      </span>
                    </motion.div>
                    
                    <h3 className="text-xl font-bold mb-2">
                      Get Early Access & Exclusive Perks
                    </h3>
                    <p className="text-muted-foreground mb-4 text-sm">
                      Be among the first to experience the future of campus commerce. 
                      <strong className="text-foreground"> 2,847+ students already joined!</strong>
                    </p>
                    
                    <div className="flex gap-2">
                      <Input 
                        type="email" 
                        placeholder="Enter your email" 
                        className="flex-1"
                      />
                      <Button className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700">
                        <Zap className="h-4 w-4 mr-2" />
                        Join Now
                      </Button>
                    </div>
                    
                    <div className="flex items-center justify-center gap-4 mt-4 text-xs text-muted-foreground">
                      {features.map((feature, index) => (
                        <motion.div
                          key={feature.text}
                          initial={{ opacity: 0, x: -20 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.5, delay: index * 0.1 }}
                          viewport={{ once: true }}
                          className="flex items-center gap-1"
                        >
                          <CheckCircle className="h-3 w-3 text-green-500" />
                          {feature.text}
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Quick Links */}
          <div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              viewport={{ once: true }}
            >
              <h3 className="text-lg font-semibold mb-6">Quick Links</h3>
              <ul className="space-y-3">
                {quickLinks.map((link, index) => (
                  <motion.li
                    key={link.name}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    viewport={{ once: true }}
                  >
                    <a 
                      href={link.href}
                      className="text-muted-foreground hover:text-green-600 dark:hover:text-green-400 transition-colors duration-300 flex items-center gap-2"
                    >
                      <ArrowRight className="h-3 w-3" />
                      {link.name}
                    </a>
                  </motion.li>
                ))}
              </ul>
            </motion.div>
          </div>

          {/* Contact & Social */}
          <div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
            >
              <h3 className="text-lg font-semibold mb-6">Get in Touch</h3>
              <div className="space-y-4 mb-6">
                <div className="flex items-center gap-3 text-muted-foreground">
                  <Mail className="h-4 w-4 text-green-600 dark:text-green-400" />
                  <span className="text-sm">support@campusmarket.co.zw</span>
                </div>
                <div className="flex items-center gap-3 text-muted-foreground">
                  <Phone className="h-4 w-4 text-green-600 dark:text-green-400" />
                  <span className="text-sm">+263 786 223 289</span>
                </div>
                <div className="flex items-center gap-3 text-muted-foreground">
                  <MapPin className="h-4 w-4 text-green-600 dark:text-green-400" />
                  <span className="text-sm">Zimbabwe</span>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-4">Follow Us</h4>
                <div className="flex gap-3">
                  {socialLinks.map((social, index) => (
                    <motion.a
                      key={social.name}
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      initial={{ opacity: 0, scale: 0 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                      viewport={{ once: true }}
                      className="w-10 h-10 rounded-full bg-gradient-to-r from-green-500 to-blue-500 flex items-center justify-center text-white hover:scale-110 transition-transform duration-300"
                    >
                      <social.icon className="h-4 w-4" />
                    </motion.a>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true }}
        className="border-t bg-muted/30"
      >
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>© 2025 Campus Marketplace. All rights reserved.</span>
              <div className="flex items-center gap-2">
                <Star className="h-3 w-3 text-yellow-500" />
                <span>Made with <Heart className="inline h-3 w-3 text-red-500" /> for Zimbabwean students</span>
              </div>
            </div>
            
            <div className="flex items-center gap-6 text-sm">
              <a href="/privacy-policy" className="text-muted-foreground hover:text-green-600 dark:hover:text-green-400 transition-colors">
                Privacy Policy
              </a>
              <a href="/terms" className="text-muted-foreground hover:text-green-600 dark:hover:text-green-400 transition-colors">
                Terms of Service
              </a>
              <a href="/contact" className="text-muted-foreground hover:text-green-600 dark:hover:text-green-400 transition-colors">
                Contact
              </a>
            </div>
          </div>
        </div>
      </motion.div>
    </footer>
  )
}
