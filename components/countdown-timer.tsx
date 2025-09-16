"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Clock, Calendar, Sparkles } from "lucide-react"

interface TimeLeft {
  days: number
  hours: number
  minutes: number
  seconds: number
}

interface CountdownTimerProps {
  onClose: () => void
}

export default function CountdownTimer({ onClose }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  })

  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Set launch date to September 22nd of current year
    const currentYear = new Date().getFullYear()
    const launchDate = new Date(currentYear, 8, 22) // Month is 0-indexed, so 8 = September
    
    // If September 22nd has passed this year, set it for next year
    if (launchDate < new Date()) {
      launchDate.setFullYear(currentYear + 1)
    }

    const calculateTimeLeft = () => {
      const now = new Date().getTime()
      const difference = launchDate.getTime() - now

      if (difference > 0) {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24))
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60))
        const seconds = Math.floor((difference % (1000 * 60)) / 1000)

        setTimeLeft({ days, hours, minutes, seconds })
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 })
      }
    }

    // Calculate immediately
    calculateTimeLeft()
    setIsVisible(true)

    // Update every second
    const timer = setInterval(calculateTimeLeft, 1000)

    return () => clearInterval(timer)
  }, [])

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: isVisible ? 1 : 0, scale: isVisible ? 1 : 0.8 }}
      transition={{ duration: 0.5 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-sm"
    >
      <div className="container max-w-4xl mx-auto px-4">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="text-center space-y-8"
        >
          {/* Header */}
          <div className="space-y-4">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.4, type: "spring", stiffness: 200 }}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-green-500/20 to-blue-500/20 border border-green-200 dark:border-green-800"
            >
              <Sparkles className="h-5 w-5 text-green-600 dark:text-green-400" />
              <span className="text-lg font-semibold text-green-700 dark:text-green-300">
                Big Thing Coming
              </span>
            </motion.div>

            <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-green-600 via-blue-600 to-purple-600 bg-clip-text text-transparent">
              Something Amazing
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              We're working on something incredible that will revolutionize your campus experience. 
              Stay tuned for the big reveal!
            </p>
          </div>

          {/* Countdown Timer */}
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.5 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto"
          >
            {[
              { label: "Days", value: timeLeft.days, icon: Calendar },
              { label: "Hours", value: timeLeft.hours, icon: Clock },
              { label: "Minutes", value: timeLeft.minutes, icon: Clock },
              { label: "Seconds", value: timeLeft.seconds, icon: Clock },
            ].map((item, index) => (
              <motion.div
                key={item.label}
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.8 + index * 0.1, type: "spring", stiffness: 200 }}
                className="relative group"
              >
                <div className="bg-gradient-to-br from-green-50 to-blue-50 dark:from-green-950/50 dark:to-blue-950/50 rounded-2xl p-6 border border-green-200 dark:border-green-800 shadow-lg hover:shadow-xl transition-all duration-300">
                  <div className="flex flex-col items-center space-y-2">
                    <item.icon className="h-6 w-6 text-green-600 dark:text-green-400" />
                    <div className="text-3xl md:text-4xl font-bold text-green-700 dark:text-green-300">
                      {item.value.toString().padStart(2, '0')}
                    </div>
                    <div className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                      {item.label}
                    </div>
                  </div>
                  
                  {/* Animated border */}
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-green-500/20 to-blue-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Launch Date */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 1.2, duration: 0.5 }}
            className="text-center"
          >
            <p className="text-lg text-muted-foreground">
              Launching on <span className="font-semibold text-green-600 dark:text-green-400">September 22nd</span>
            </p>
          </motion.div>

          {/* Close Button */}
          <motion.button
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 1.4, duration: 0.5 }}
            onClick={onClose}
            className="px-8 py-3 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-full font-semibold hover:from-green-700 hover:to-blue-700 transition-all duration-300 shadow-lg hover:shadow-xl"
          >
            Close
          </motion.button>
        </motion.div>
      </div>
    </motion.div>
  )
}
