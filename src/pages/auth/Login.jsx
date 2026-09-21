import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Lock,
  Smartphone,
  ArrowRight,
  Loader2,
  Shield,
  CheckCircle2,
  Eye,
  EyeOff,
  Zap,
  TrendingUp,
  Users,
  Clock,
  Sparkles,
  Globe,
  Server,
  Database,
  Activity,
  BarChart3,
  ShieldCheck,
  Fingerprint,
  KeyRound,
} from "lucide-react";
import toast from "react-hot-toast";
import { authService } from "../../api/authService";
import { getTracker } from "../../utils/getTracker";

const Login = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [particles, setParticles] = useState([]);
  const [currentStat, setCurrentStat] = useState(0);
  const [typedText, setTypedText] = useState("");
  const [isTyping, setIsTyping] = useState(true);

  const [formData, setFormData] = useState({
    number: "",
    password: "",
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // KEEP ORIGINAL LOGIN LOGIC - NO CHANGES
  const handleLogin = async (e) => {
    e.preventDefault();

    if (!formData.number || !formData.password) {
      toast.error("Please enter credentials");
      return;
    }

    setLoading(true);

    try {
      const payload = {
        number: String(formData.number).trim(),
        password: formData.password,
      };

      console.log("Sending Login Payload:", payload);

      const response = await authService.login(payload);

      if (response.statusCode === 200 && response.data.token) {
        localStorage.setItem("token", response.data.token);
        localStorage.setItem("user", JSON.stringify(response.data));

        // Initialize activity tracker on login (role-based)
        const tracker = getTracker();
        tracker.initialize();
        tracker.trackLogin();

        const userRole = response.data.role?.toLowerCase();
        const userName = response.data.name || "User";

        toast.success(`Welcome back, ${userName}!`);

        setTimeout(() => {
          // Role-based navigation
          if (userRole === "supervisor") {
            navigate("/supervisor/dashboard");
          } else {
            // Admin, Manager, or other roles go to main dashboard
            navigate("/");
          }
        }, 800);
      } else {
        throw new Error(response.message || "Access Denied");
      }
    } catch (error) {
      console.error("Login Error:", error);
      toast.error(error.message || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  // Particle system for background
  useEffect(() => {
    const newParticles = Array.from({ length: 30 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 4 + 2,
      duration: Math.random() * 20 + 15,
      delay: Math.random() * 5,
    }));
    setParticles(newParticles);
  }, []);

  // Typing effect
  useEffect(() => {
    const phrases = [
      "Secure Access Portal",
      "Admin Dashboard",
      "Management Console",
      "Control Center",
    ];
    let phraseIndex = 0;
    let charIndex = 0;
    let isDeleting = false;

    const typeInterval = setInterval(
      () => {
        const currentPhrase = phrases[phraseIndex];

        if (!isDeleting && charIndex < currentPhrase.length) {
          setTypedText(currentPhrase.substring(0, charIndex + 1));
          charIndex++;
        } else if (isDeleting && charIndex > 0) {
          setTypedText(currentPhrase.substring(0, charIndex - 1));
          charIndex--;
        } else if (!isDeleting && charIndex === currentPhrase.length) {
          setTimeout(() => {
            isDeleting = true;
          }, 2000);
        } else if (isDeleting && charIndex === 0) {
          isDeleting = false;
          phraseIndex = (phraseIndex + 1) % phrases.length;
        }
      },
      isDeleting ? 50 : 100,
    );

    return () => clearInterval(typeInterval);
  }, []);

  // Rotating statistics
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStat((prev) => (prev + 1) % 4);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const stats = [
    { icon: Users, label: "Active Users", value: "1,247+", color: "indigo" },
    {
      icon: TrendingUp,
      label: "Success Rate",
      value: "99.8%",
      color: "emerald",
    },
    { icon: Clock, label: "Uptime", value: "99.9%", color: "purple" },
    { icon: Shield, label: "Secure", value: "100%", color: "blue" },
  ];

  const features = [
    {
      icon: ShieldCheck,
      title: "Bank-Grade Security",
      description: "256-bit SSL encryption protects your data",
    },
    {
      icon: Zap,
      title: "Lightning Fast",
      description: "Optimized for speed and performance",
    },
    {
      icon: Database,
      title: "Real-time Sync",
      description: "Instant updates across all devices",
    },
    {
      icon: Fingerprint,
      title: "Advanced Auth",
      description: "Multi-layer authentication system",
    },
  ];

  const securityBadges = [
    { icon: Shield, text: "SSL Secured" },
    { icon: Lock, text: "Encrypted" },
    { icon: Server, text: "Cloud Backup" },
    { icon: Activity, text: "24/7 Monitor" },
  ];

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 relative overflow-hidden font-sans">
      {/* Enhanced Global Styles */}
      <style>{`
        input:-webkit-autofill,
        input:-webkit-autofill:hover,
        input:-webkit-autofill:focus,
        input:-webkit-autofill:active {
          -webkit-background-clip: text;
          -webkit-text-fill-color: #ffffff !important;
          transition: background-color 5000s ease-in-out 0s;
          box-shadow: inset 0 0 20px 20px #23232329;
        }
        
        @keyframes blob {
          0%, 100% { transform: translate(0px, 0px) scale(1) rotate(0deg); }
          25% { transform: translate(30px, -50px) scale(1.1) rotate(90deg); }
          50% { transform: translate(-20px, 20px) scale(0.9) rotate(180deg); }
          75% { transform: translate(40px, 30px) scale(1.05) rotate(270deg); }
        }
        
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(180deg); }
        }
        
        @keyframes pulse-glow {
          0%, 100% { box-shadow: 0 0 20px rgba(99, 102, 241, 0.4); }
          50% { box-shadow: 0 0 40px rgba(99, 102, 241, 0.8); }
        }
        
        @keyframes gradient-shift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        
        .animate-blob {
          animation: blob 15s infinite;
        }
        
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        
        .animate-pulse-glow {
          animation: pulse-glow 3s ease-in-out infinite;
        }
        
        .animate-gradient {
          background-size: 200% 200%;
          animation: gradient-shift 10s ease infinite;
        }
        
        .animation-delay-1000 { animation-delay: 1s; }
        .animation-delay-2000 { animation-delay: 2s; }
        .animation-delay-3000 { animation-delay: 3s; }
        .animation-delay-4000 { animation-delay: 4s; }
        
        .grid-pattern {
          background-image: 
            linear-gradient(rgba(99, 102, 241, 0.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(99, 102, 241, 0.05) 1px, transparent 1px);
          background-size: 50px 50px;
        }
        
        .cursor-trail {
          pointer-events: none;
          position: fixed;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(99, 102, 241, 0.6), transparent);
          transition: transform 0.2s ease-out;
        }
      `}</style>

      {/* Animated Grid Background */}
      <div className="absolute inset-0 grid-pattern opacity-20" />

      {/* Multiple Blob Effects with Different Animations */}
      <div className="absolute top-[-20%] left-[-10%] w-[700px] h-[700px] bg-gradient-to-br from-indigo-600/40 to-purple-600/40 rounded-full blur-[140px] pointer-events-none animate-blob" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[700px] h-[700px] bg-gradient-to-tl from-purple-600/40 to-pink-600/40 rounded-full blur-[140px] pointer-events-none animate-blob animation-delay-2000" />
      <div className="absolute bottom-[20%] left-[20%] w-[500px] h-[500px] bg-gradient-to-tr from-blue-600/30 to-cyan-600/30 rounded-full blur-[120px] pointer-events-none animate-blob animation-delay-4000" />
      <div className="absolute top-[30%] right-[25%] w-[400px] h-[400px] bg-gradient-to-bl from-violet-600/30 to-fuchsia-600/30 rounded-full blur-[100px] pointer-events-none animate-blob animation-delay-1000" />

      {/* Floating Particles */}
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute w-2 h-2 bg-indigo-400/30 rounded-full"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
          }}
          animate={{
            y: [0, -100, 0],
            x: [0, Math.random() * 50 - 25, 0],
            opacity: [0, 1, 0],
            scale: [0, particle.size / 2, 0],
          }}
          transition={{
            duration: particle.duration,
            repeat: Infinity,
            delay: particle.delay,
            ease: "easeInOut",
          }}
        />
      ))}

      {/* Floating Decorative Icons */}
      <motion.div
        className="absolute top-20 left-20 text-indigo-400/20"
        animate={{ y: [0, -20, 0], rotate: [0, 360] }}
        transition={{ duration: 8, repeat: Infinity }}
      >
        <Globe className="w-16 h-16" />
      </motion.div>
      <motion.div
        className="absolute bottom-20 right-20 text-purple-400/20"
        animate={{ y: [0, 20, 0], rotate: [360, 0] }}
        transition={{ duration: 10, repeat: Infinity }}
      >
        <Server className="w-20 h-20" />
      </motion.div>
      <motion.div
        className="absolute top-1/3 right-10 text-blue-400/20"
        animate={{ y: [0, -30, 0], x: [0, 10, 0] }}
        transition={{ duration: 7, repeat: Infinity }}
      >
        <Database className="w-12 h-12" />
      </motion.div>

      {/* Main Content Container */}
      <div className="w-full max-w-7xl mx-auto px-4 md:px-8 flex items-center justify-between gap-12 relative z-10">
        {/* Left Side - Info Panel */}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="hidden lg:flex flex-col flex-1 space-y-8"
        >
          {/* Brand Section */}
          <div>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="flex items-center gap-4 mb-6"
            >
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl blur-xl opacity-75 animate-pulse-glow" />
                <div className="relative bg-gradient-to-br from-indigo-600 to-purple-600 p-4 rounded-2xl">
                  <Sparkles className="w-10 h-10 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-4xl font-black text-white mb-1">
                  BCW Admin
                </h1>
                <p className="text-indigo-300 text-sm font-medium">
                  Business Control & Workflow
                </p>
              </div>
            </motion.div>

            {/* Typing Effect Title */}
            <div className="h-16 mb-8">
              <h2 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-200 via-purple-200 to-pink-200 animate-gradient">
                {typedText}
                <motion.span
                  animate={{ opacity: [1, 0] }}
                  transition={{ duration: 0.8, repeat: Infinity }}
                  className="ml-1"
                >
                  |
                </motion.span>
              </h2>
            </div>

            <p className="text-slate-300 text-lg leading-relaxed mb-8">
              Access your comprehensive business management dashboard with
              enterprise-grade security and real-time analytics. Streamline
              operations, monitor performance, and make data-driven decisions.
            </p>
          </div>

          {/* Animated Statistics */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStat}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
              className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
            >
              {(() => {
                const StatIcon = stats[currentStat].icon;
                return (
                  <div className="flex items-center gap-4">
                    <div
                      className={`p-4 rounded-xl bg-gradient-to-br from-${stats[currentStat].color}-500/20 to-${stats[currentStat].color}-600/20 border border-${stats[currentStat].color}-500/30`}
                    >
                      <StatIcon
                        className={`w-8 h-8 text-${stats[currentStat].color}-400`}
                      />
                    </div>
                    <div className="flex-1">
                      <p className="text-slate-400 text-sm font-medium">
                        {stats[currentStat].label}
                      </p>
                      <p className="text-3xl font-bold text-white mt-1">
                        {stats[currentStat].value}
                      </p>
                    </div>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "linear",
                      }}
                    >
                      <BarChart3 className="w-6 h-6 text-indigo-400/50" />
                    </motion.div>
                  </div>
                );
              })()}
            </motion.div>
          </AnimatePresence>

          {/* Features Grid */}
          <div className="grid grid-cols-2 gap-4">
            {features.map((feature, index) => {
              const FeatureIcon = feature.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                  whileHover={{ scale: 1.05, y: -5 }}
                  className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-xl p-4 hover:bg-white/10 transition-all duration-300 cursor-pointer group"
                >
                  <FeatureIcon className="w-8 h-8 text-indigo-400 mb-3 group-hover:scale-110 transition-transform" />
                  <h3 className="text-white font-semibold text-sm mb-1">
                    {feature.title}
                  </h3>
                  <p className="text-slate-400 text-xs leading-relaxed">
                    {feature.description}
                  </p>
                </motion.div>
              );
            })}
          </div>

          {/* Security Badges */}
          <div className="flex flex-wrap gap-3">
            {securityBadges.map((badge, index) => {
              const BadgeIcon = badge.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.6 + index * 0.1 }}
                  className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 px-4 py-2 rounded-full"
                >
                  <BadgeIcon className="w-4 h-4 text-emerald-400" />
                  <span className="text-emerald-300 text-xs font-semibold">
                    {badge.text}
                  </span>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* Right Side - Login Form */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="w-full lg:w-auto lg:min-w-[480px] relative"
        >
          {/* Glow Effect Behind Card */}
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/30 to-purple-600/30 rounded-3xl blur-3xl" />

          <div className="relative bg-slate-900/60 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-2xl p-8 md:p-10">
            {/* Form Header */}
            <div className="text-center mb-10">
              {/* Animated Logo */}
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{
                  type: "spring",
                  stiffness: 200,
                  damping: 20,
                  delay: 0.2,
                }}
                className="relative w-28 h-28 mx-auto mb-6"
              >
                <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 rounded-full animate-[spin_6s_linear_infinite] blur-md opacity-75" />
                <div className="relative w-full h-full rounded-full flex items-center justify-center overflow-hidden bg-slate-950 border-4 border-white/20 shadow-2xl shadow-indigo-500/50 p-2">
                  <img
                    src="/carwash.jpeg"
                    alt="BCW Logo"
                    className="w-full h-full object-cover rounded-full"
                  />
                </div>
                {/* Floating Ring */}
                <motion.div
                  animate={{ rotate: 360, scale: [1, 1.1, 1] }}
                  transition={{ duration: 4, repeat: Infinity }}
                  className="absolute inset-0 border-2 border-dashed border-indigo-400/30 rounded-full"
                />
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-200 via-purple-200 to-pink-200 tracking-tight mb-2"
              >
                Welcome Back
              </motion.h1>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="text-slate-400 text-sm flex items-center justify-center gap-2"
              >
                <KeyRound className="w-4 h-4" />
                Secure Authentication Required
              </motion.p>
            </div>

            {/* Login Form */}
            <form onSubmit={handleLogin} className="space-y-6">
              {/* Phone Number Input */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 }}
                className="space-y-2"
              >
                <label className="flex items-center gap-2 text-xs font-bold text-slate-300 uppercase tracking-wider ml-1">
                  <Smartphone className="w-3.5 h-3.5" />
                  Phone ID
                </label>
                <div
                  className={`group relative flex items-center bg-slate-800/50 border-2 rounded-2xl transition-all duration-300 ${
                    focusedField === "number"
                      ? "border-indigo-500 ring-4 ring-indigo-500/20 shadow-lg shadow-indigo-500/20 bg-slate-800/70"
                      : "border-white/10 hover:border-white/20 hover:bg-slate-800/60"
                  }`}
                >
                  <div
                    className={`pl-5 transition-all duration-300 ${
                      focusedField === "number"
                        ? "text-indigo-400 scale-110"
                        : "text-slate-500"
                    }`}
                  >
                    <Smartphone className="w-5 h-5" />
                  </div>
                  <input
                    type="text"
                    name="number"
                    value={formData.number}
                    onChange={handleChange}
                    onFocus={() => setFocusedField("number")}
                    onBlur={() => setFocusedField(null)}
                    className="w-full bg-transparent text-white px-4 py-4 outline-none placeholder-slate-600 font-medium"
                    placeholder="Enter registered number"
                    autoComplete="off"
                  />
                  {formData.number && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="pr-4"
                    >
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    </motion.div>
                  )}
                </div>
              </motion.div>

              {/* Password Input */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.7 }}
                className="space-y-2"
              >
                <label className="flex items-center gap-2 text-xs font-bold text-slate-300 uppercase tracking-wider ml-1">
                  <Lock className="w-3.5 h-3.5" />
                  Password
                </label>
                <div
                  className={`group relative flex items-center bg-slate-800/50 border-2 rounded-2xl transition-all duration-300 ${
                    focusedField === "password"
                      ? "border-indigo-500 ring-4 ring-indigo-500/20 shadow-lg shadow-indigo-500/20 bg-slate-800/70"
                      : "border-white/10 hover:border-white/20 hover:bg-slate-800/60"
                  }`}
                >
                  <div
                    className={`pl-5 transition-all duration-300 ${
                      focusedField === "password"
                        ? "text-indigo-400 scale-110"
                        : "text-slate-500"
                    }`}
                  >
                    <Lock className="w-5 h-5" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    onFocus={() => setFocusedField("password")}
                    onBlur={() => setFocusedField(null)}
                    className="w-full bg-transparent text-white px-4 py-4 outline-none placeholder-slate-600 font-medium"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="pr-5 text-slate-500 hover:text-indigo-400 transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </motion.div>

              {/* Submit Button */}
              <motion.button
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                whileHover={{
                  scale: 1.02,
                  boxShadow: "0 20px 40px rgba(99, 102, 241, 0.4)",
                }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={loading}
                className="relative w-full bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:via-purple-500 hover:to-pink-500 text-white font-bold py-5 rounded-2xl shadow-2xl shadow-indigo-600/40 flex items-center justify-center gap-3 transition-all disabled:opacity-70 disabled:cursor-not-allowed mt-8 border border-white/20 overflow-hidden group"
              >
                {/* Button Shine Effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />

                {loading ? (
                  <>
                    <Loader2 className="w-6 h-6 animate-spin" />
                    <span className="text-lg">Authenticating...</span>
                  </>
                ) : (
                  <>
                    <Shield className="w-6 h-6" />
                    <span className="text-lg">Sign In Securely</span>
                    <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </motion.button>
            </form>

            {/* Footer */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.9 }}
              className="mt-8 pt-6 border-t border-white/10"
            >
              <div className="flex items-center justify-center gap-2 text-slate-500 text-xs mb-4">
                <Shield className="w-4 h-4" />
                <span>Protected by 256-bit SSL Encryption</span>
              </div>
              <p className="text-center text-slate-500 text-xs leading-relaxed">
                Authorized personnel only. All access attempts are logged and
                monitored.
                <br />
                <span className="text-slate-600">
                  © 2026 BCW Admin. All rights reserved.
                </span>
              </p>
            </motion.div>
          </div>

          {/* Floating Security Indicators */}
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 3, repeat: Infinity }}
            className="absolute -top-4 -right-4 bg-emerald-500/10 backdrop-blur-lg border border-emerald-500/30 rounded-full px-4 py-2 flex items-center gap-2"
          >
            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
            <span className="text-emerald-300 text-xs font-bold">
              System Online
            </span>
          </motion.div>

          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 2.5, repeat: Infinity }}
            className="absolute -bottom-4 -left-4 bg-blue-500/10 backdrop-blur-lg border border-blue-500/30 rounded-full px-4 py-2 flex items-center gap-2"
          >
            <Activity className="w-4 h-4 text-blue-400" />
            <span className="text-blue-300 text-xs font-bold">
              High Security
            </span>
          </motion.div>
        </motion.div>
      </div>

      {/* Bottom Decorative Bar */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 animate-gradient" />
    </div>
  );
};

export default Login;
