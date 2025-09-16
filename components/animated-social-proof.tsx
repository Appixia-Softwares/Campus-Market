"use client"

import { motion } from "framer-motion"
import { Star, Quote, Users, TrendingUp, Clock } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

const testimonials = [
  {
    name: "Tendai M.",
    university: "University of Zimbabwe",
    text: "I've been waiting for something like this! Finally, a platform that understands students' needs. Can't wait for the launch!",
    rating: 5,
    highlight: "Early Adopter"
  },
  {
    name: "Sarah K.",
    university: "NUST",
    text: "The features they're promising sound incredible. Zero fees, instant payments, and verified students only? Sign me up!",
    rating: 5,
    highlight: "Beta Tester"
  },
  {
    name: "Blessing T.",
    university: "CUT",
    text: "This is going to revolutionize how we buy and sell on campus. I've already told all my friends to join the waitlist!",
    rating: 5,
    highlight: "Campus Ambassador"
  }
]

const universities = [
  "University of Zimbabwe", "NUST", "CUT", "MSU", "CUZ", "HIT", "ZOU", "LSU", "GZU", "CHU"
]

const stats = [
  { icon: <Users className="h-5 w-5" />, value: "2,847+", label: "Students Waiting" },
  { icon: <TrendingUp className="h-5 w-5" />, value: "15+", label: "Universities" },
  { icon: <Clock className="h-5 w-5" />, value: "22", label: "Days to Launch" },
  { icon: <Star className="h-5 w-5" />, value: "4.9/5", label: "Expected Rating" }
]

export default function AnimatedSocialProof() {
  return (
    <section className="py-20 bg-gradient-to-b from-muted/20 to-background">
      <div className="container mx-auto px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            <span className="bg-gradient-to-r from-green-600 via-blue-600 to-purple-600 bg-clip-text text-transparent">
              Students Are Already Excited
            </span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Join thousands of students who can't wait for the launch. Here's what they're saying:
          </p>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          viewport={{ once: true }}
          className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16"
        >
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="text-center"
            >
              <div className="bg-gradient-to-br from-green-50 to-blue-50 dark:from-green-950/50 dark:to-blue-950/50 rounded-2xl p-6 border border-green-200 dark:border-green-800">
                <div className="flex items-center justify-center mb-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-r from-green-500 to-blue-500 flex items-center justify-center text-white">
                    {stat.icon}
                  </div>
                </div>
                <div className="text-2xl font-bold text-green-600 dark:text-green-400 mb-1">
                  {stat.value}
                </div>
                <div className="text-sm text-muted-foreground font-medium">
                  {stat.label}
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Testimonials */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.2 }}
              viewport={{ once: true }}
              className="group"
            >
              <Card className="h-full border-0 shadow-lg hover:shadow-2xl transition-all duration-500 bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800">
                <CardContent className="p-6 relative">
                  {/* Quote icon */}
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    whileInView={{ scale: 1, rotate: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.2 + 0.3 }}
                    viewport={{ once: true }}
                    className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gradient-to-r from-green-500 to-blue-500 flex items-center justify-center"
                  >
                    <Quote className="h-4 w-4 text-white" />
                  </motion.div>

                  {/* Highlight badge */}
                  <motion.div
                    initial={{ scale: 0 }}
                    whileInView={{ scale: 1 }}
                    transition={{ duration: 0.5, delay: index * 0.2 + 0.4 }}
                    viewport={{ once: true }}
                    className="absolute top-4 left-4 px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-green-500 to-blue-500 text-white"
                  >
                    {testimonial.highlight}
                  </motion.div>

                  {/* Rating */}
                  <div className="flex items-center gap-1 mb-4 mt-8">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <motion.div
                        key={i}
                        initial={{ scale: 0 }}
                        whileInView={{ scale: 1 }}
                        transition={{ duration: 0.3, delay: index * 0.2 + 0.5 + i * 0.1 }}
                        viewport={{ once: true }}
                      >
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      </motion.div>
                    ))}
                  </div>

                  {/* Testimonial text */}
                  <p className="text-muted-foreground mb-4 leading-relaxed">
                    "{testimonial.text}"
                  </p>

                  {/* Author */}
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-r from-green-500 to-blue-500 flex items-center justify-center text-white font-semibold">
                      {testimonial.name.charAt(0)}
                    </div>
                    <div>
                      <div className="font-semibold text-sm">{testimonial.name}</div>
                      <div className="text-xs text-muted-foreground">{testimonial.university}</div>
                    </div>
                  </div>

                  {/* Hover effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-green-500/5 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-lg" />
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Universities */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <h3 className="text-2xl font-bold mb-8">
            Trusted by Students Across Zimbabwe
          </h3>
          <div className="flex flex-wrap justify-center gap-4">
            {universities.map((university, index) => (
              <motion.div
                key={university}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: index * 0.05 }}
                viewport={{ once: true }}
                className="px-4 py-2 rounded-full bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-950/50 dark:to-blue-950/50 border border-green-200 dark:border-green-800 text-sm font-medium text-muted-foreground hover:text-green-600 dark:hover:text-green-400 transition-colors duration-300"
              >
                {university}
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  )
}
