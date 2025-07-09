import { useEffect, useState, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Info, 
  Bell,
  Star,
  Gift,
  Sparkles,
  ThumbsUp,
  Heart
} from "lucide-react"

type ToastType = 
  | "success" 
  | "error" 
  | "warning" 
  | "info" 
  | "notification"
  | "achievement"
  | "reward"
  | "celebration"
  | "like"
  | "favorite"

interface ToastProps {
  message: string
  type: ToastType
  onClose: () => void
  duration?: number
  title?: string
  sound?: boolean
}

const icons = {
  success: CheckCircle2,
  error: XCircle,
  warning: AlertCircle,
  info: Info,
  notification: Bell,
  achievement: Star,
  reward: Gift,
  celebration: Sparkles,
  like: ThumbsUp,
  favorite: Heart
}

const colors = {
  success: "bg-green-50 border-green-200 text-green-800",
  error: "bg-red-50 border-red-200 text-red-800",
  warning: "bg-yellow-50 border-yellow-200 text-yellow-800",
  info: "bg-blue-50 border-blue-200 text-blue-800",
  notification: "bg-purple-50 border-purple-200 text-purple-800",
  achievement: "bg-amber-50 border-amber-200 text-amber-800",
  reward: "bg-pink-50 border-pink-200 text-pink-800",
  celebration: "bg-indigo-50 border-indigo-200 text-indigo-800",
  like: "bg-sky-50 border-sky-200 text-sky-800",
  favorite: "bg-rose-50 border-rose-200 text-rose-800"
}

const animations = {
  initial: { opacity: 0, y: 50, scale: 0.3 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, scale: 0.5, transition: { duration: 0.2 } },
  hover: { scale: 1.02, transition: { duration: 0.2 } },
  tap: { scale: 0.98 }
}

export function CustomToast({ 
  message, 
  type, 
  onClose, 
  duration = 5000,
  title,
  sound = true 
}: ToastProps) {
  const [progress, setProgress] = useState(100)
  const [isHovered, setIsHovered] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const Icon = icons[type]

  useEffect(() => {
    if (sound) {
      audioRef.current = new Audio('/sounds/notification.mp3')
      audioRef.current.play().catch(() => {
        // Handle autoplay restrictions
        console.log('Autoplay prevented')
      })
    }
  }, [sound])

  useEffect(() => {
    if (!isHovered) {
      const timer = setInterval(() => {
        setProgress((prev) => {
          if (prev <= 0) {
            clearInterval(timer)
            onClose()
            return 0
          }
          return prev - (100 / (duration / 100))
        })
      }, 100)

      return () => clearInterval(timer)
    }
  }, [duration, onClose, isHovered])

  return (
    <motion.div
      initial={animations.initial}
      animate={animations.animate}
      exit={animations.exit}
      whileHover={animations.hover}
      whileTap={animations.tap}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className={`fixed bottom-4 right-4 z-50 flex items-center gap-3 rounded-lg border p-4 shadow-lg backdrop-blur-sm ${colors[type]}`}
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 10 }}
      >
        <Icon className="h-5 w-5" />
      </motion.div>
      
      <div className="flex-1">
        {title && (
          <h3 className="text-sm font-semibold mb-1">{title}</h3>
        )}
        <p className="text-sm font-medium">{message}</p>
        {!isHovered && (
          <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-white/20">
            <motion.div
              className="h-full bg-current"
              initial={{ width: "100%" }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.1 }}
            />
          </div>
        )}
      </div>

      <motion.button
        onClick={onClose}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        className="ml-2 rounded-full p-1 hover:bg-white/20"
      >
        <XCircle className="h-4 w-4" />
      </motion.button>
    </motion.div>
  )
}

// Toast Container Component
export function ToastContainer() {
  const [toasts, setToasts] = useState<Array<{ id: string } & ToastProps>>([])

  const addToast = (props: Omit<ToastProps, "onClose">) => {
    const id = Math.random().toString(36).substring(7)
    setToasts((prev) => [...prev, { ...props, id, onClose: () => removeToast(id) }])
  }

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }

  return (
    <div className="fixed bottom-0 right-0 z-50 m-4 flex flex-col gap-2">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <CustomToast key={toast.id} {...toast} />
        ))}
      </AnimatePresence>
    </div>
  )
}

// Toast Hook
export function useToast() {
  const [toasts, setToasts] = useState<Array<{ id: string } & ToastProps>>([])

  const toast = (props: Omit<ToastProps, "onClose">) => {
    const id = Math.random().toString(36).substring(7)
    setToasts((prev) => [...prev, { ...props, id, onClose: () => removeToast(id) }])
  }

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }

  return {
    toast,
    toasts,
  }
}
