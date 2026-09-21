import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

/**
 * Centralized Modal Manager Component
 * All modals go through this component for consistent styling and logging
 *
 * Usage:
 * <ModalManager
 *   isOpen={isOpen}
 *   onClose={onClose}
 *   title="Modal Title"
 *   pageName="LOCATIONS"
 *   modalType="CREATE/EDIT/DELETE"
 * >
 *   {children}
 * </ModalManager>
 */

const ModalManager = ({
  isOpen,
  onClose,
  title,
  children,
  pageName = "PAGE",
  modalType = "MODAL",
  size = "md", // sm, md, lg, xl
  showCloseButton = true,
  closeOnBackdrop = true,
}) => {
  // Size classes
  const sizeClasses = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-2xl",
    xl: "max-w-4xl",
    full: "max-w-full mx-4",
  };

  // Log modal lifecycle
  useEffect(() => {
    if (isOpen) {
      console.log("🎭 ═══════════════════════════════════════════════════════");
      console.log(`🎭 [MODAL MANAGER] ${pageName} - ${modalType} Modal Opened`);
      console.log(`📋 Modal Title: ${title}`);
      console.log(`⏰ Opened at: ${new Date().toLocaleTimeString()}`);
      console.log("🎭 ═══════════════════════════════════════════════════════");
    } else {
      console.log(`👋 [MODAL MANAGER] ${pageName} - ${modalType} Modal Closed`);
    }
  }, [isOpen, pageName, modalType, title]);

  // Handle close with logging
  const handleClose = () => {
    console.log(`❌ [MODAL MANAGER] User closed ${modalType} modal`);
    onClose();
  };

  // Handle backdrop click
  const handleBackdropClick = () => {
    if (closeOnBackdrop) {
      console.log(
        `🖱️ [MODAL MANAGER] Backdrop clicked - closing ${modalType} modal`
      );
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={handleBackdropClick}
          className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
        />

        {/* Modal Content */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className={`bg-white w-full ${sizeClasses[size]} rounded-2xl shadow-2xl overflow-hidden relative z-10`}
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-50 to-white">
            <h3 className="text-lg font-bold text-slate-800">{title}</h3>
            {showCloseButton && (
              <button
                onClick={handleClose}
                className="p-1 rounded-full hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors"
                type="button"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Content */}
          <div className="relative">{children}</div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default ModalManager;
