/**
 * Page Logger Utility
 * Use this in your page components to log when they mount and what API calls they make
 */

export const pageLogger = {
  // Log when a page mounts
  onMount: (pageName) => {
    console.group(`📄 [${pageName}] Page Loaded`);
    console.log(`⏰ Time: ${new Date().toLocaleTimeString()}`);
    console.log(`🌐 Path: ${window.location.pathname}`);
    console.log(`📊 Preparing to fetch data...`);
    console.groupEnd();
  },

  // Log when a page unmounts
  onUnmount: (pageName) => {
    console.log(`👋 [${pageName}] Page Unmounted`);
  },

  // Log a custom action
  action: (pageName, actionName, data = null) => {
    console.group(`🎬 [${pageName}] ${actionName}`);
    console.log(`⏰ Time: ${new Date().toLocaleTimeString()}`);
    if (data) {
      console.log(`📦 Data:`, data);
    }
    console.groupEnd();
  },

  // Log an error
  error: (pageName, error) => {
    console.group(`❌ [${pageName}] Error`);
    console.error(`⏰ Time: ${new Date().toLocaleTimeString()}`);
    console.error(`💬 Error:`, error);
    console.groupEnd();
  },
};

// Hook to automatically log page lifecycle
export const usePageLogger = (pageName) => {
  React.useEffect(() => {
    pageLogger.onMount(pageName);

    return () => {
      pageLogger.onUnmount(pageName);
    };
  }, [pageName]);
};
