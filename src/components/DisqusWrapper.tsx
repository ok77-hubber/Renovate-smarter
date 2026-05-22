import React, { useEffect, useState } from "react";
import { AlertCircle, ExternalLink, HelpCircle, MessageSquare, ShieldAlert } from "lucide-react";

interface DisqusWrapperProps {
  proposalThemeName?: string;
}

declare global {
  interface Window {
    DISQUS?: {
      reset: (config: { reload: boolean; config?: () => void }) => void;
    };
    disqus_config?: (this: any) => void;
  }
}

export default function DisqusWrapper({ proposalThemeName }: DisqusWrapperProps) {
  const [loadError, setLoadError] = useState<string | null>(null);
  const isIframe = typeof window !== "undefined" && window.self !== window.top;

  const disqusShortname = "renovate-smarter";
  const disqusIdentifier = proposalThemeName 
    ? `renovate-smarter-proposal-${proposalThemeName.toLowerCase().replace(/\s+/g, "-")}` 
    : "renovate-smarter-forum-root";
  const disqusTitle = proposalThemeName 
    ? `${proposalThemeName} Layout Plan - Renovate Smarter` 
    : "Studio Atelier AI Renovate Smarter Community Hub";
  const pageUrl = typeof window !== "undefined" ? window.location.href : "https://renovate-smarter.example.com";

  const handleOpenNewTab = () => {
    if (typeof window !== "undefined") {
      window.open(window.location.href, "_blank");
    }
  };

  useEffect(() => {
    // If inside an iframe, do NOT load Disqus script to completely prevent 
    // frame-busting security sandboxing exceptions or script blocking.
    if (isIframe || typeof window === "undefined") return;

    // Set the global config for Disqus on direct page
    window.disqus_config = function (this: any) {
      this.page.url = pageUrl;
      this.page.identifier = disqusIdentifier;
      this.page.title = disqusTitle;
      this.language = "zh_TW";
    };

    // If DISQUS instance already exists, trigger its hot reset
    if (window.DISQUS) {
      try {
        window.DISQUS.reset({
          reload: true,
          config: function (this: any) {
            this.page.url = pageUrl;
            this.page.identifier = disqusIdentifier;
            this.page.title = disqusTitle;
            this.language = "zh_TW";
          }
        });
      } catch (err: any) {
        console.error("Failed to reset Disqus:", err);
      }
      return;
    }

    // Embed actual disqus javascript dynamically for sovereign direct context
    const scriptId = "disqus-embed-script";
    let script = document.getElementById(scriptId) as HTMLScriptElement | null;
    
    if (!script) {
      script = document.createElement("script");
      script.id = scriptId;
      script.src = `https://${disqusShortname}.disqus.com/embed.js`;
      script.async = true;
      script.setAttribute("data-timestamp", Date.now().toString());
      
      script.onerror = () => {
        setLoadError("Disqus script connection blocked. This typically occurs under strict tracking blockers or third-party cookie restrictions.");
      };

      document.body.appendChild(script);
    }

    return () => {
      delete window.disqus_config;
    };
  }, [disqusIdentifier, disqusTitle, pageUrl, isIframe]);

  const fallbackUI = (
    <div className="bg-stone-50 border border-stone-200 rounded-xl p-6 text-center flex flex-col items-center justify-center">
      <AlertCircle className="w-8 h-8 text-amber-600 mb-2.5" />
      <span className="text-xs uppercase tracking-wider font-mono font-bold text-stone-700">
        Disqus Sandbox Constraint Met
      </span>
      <p className="text-[11px] text-stone-500 max-w-sm leading-relaxed mt-1.5 font-light">
        Your browser or direct network safety layers blocked Disqus's cross-origin tracking scripts. Re-opening in its own direct browser tab immediately resolves the script loading sandbox restrictions.
      </p>
      <button
        type="button"
        onClick={handleOpenNewTab}
        className="mt-4 px-4 py-2 bg-[#1C242B] text-white text-[11px] font-mono uppercase tracking-wider font-bold rounded-lg hover:bg-[#C47A5C] transition duration-200 flex items-center gap-1.5 cursor-pointer"
      >
        <ExternalLink className="w-3.5 h-3.5" />
        Open App in Direct Tab
      </button>
    </div>
  );

  // If we are currently inside the sandboxed system preview iframe, render a beautiful native mock Disqus thread interface.
  // This is highly functional, informative, and acts as a pristine placeholder while ensuring the app never crashes!
  if (isIframe) {
    return (
      <div className="space-y-4">
        {/* Responsive, polished system boundary notification cards */}
        <div className="bg-amber-50/80 border border-amber-200/50 rounded-xl p-4 flex gap-3 text-left">
          <HelpCircle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="text-[11px] uppercase tracking-wider font-mono font-bold text-amber-900">
              Interactive Sandbox Isolation Mode
            </span>
            <p className="text-[11px] text-amber-800 leading-relaxed mt-1 font-light">
              To guarantee seamless security, Google AI Studio restricts third-party trackers inside iframe wrappers to prevent cross-frame script injections. Open the application directly to start utilizing the live discussion platform!
            </p>
            <button
              type="button"
              onClick={handleOpenNewTab}
              className="mt-2 text-[10px] font-bold text-[#C47A5C] hover:underline flex items-center gap-1 cursor-pointer"
            >
              Open in sovereign page tab <ExternalLink className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Beautiful mock skeleton of the Disqus comment feed to demonstrate its aesthetic alignment and state */}
        <div className="border border-stone-150 rounded-2xl p-5 bg-[#FCFAF7] shadow-3xs">
          <div className="flex items-center justify-between border-b border-stone-200/60 pb-3 mb-4">
            <span className="text-xs font-semibold text-stone-800 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-[#C47A5C]" />
              Disqus Studio Live Simulator
            </span>
            <span className="text-[9px] font-mono text-stone-400 bg-white border border-stone-200 px-2 py-0.5 rounded-lg">
              Sandbox Mock Preview
            </span>
          </div>

          <div className="space-y-4 text-left">
            {/* Mock Comment 1 */}
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-[#1C242B] text-white text-[10px] font-mono font-bold flex items-center justify-center shrink-0">
                L
              </div>
              <div className="flex-1 bg-white border border-stone-150 p-3 rounded-xl">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-stone-700">Lionel Lim (Singapore Owner)</span>
                  <span className="text-[9px] text-stone-400 font-mono">2 hrs ago</span>
                </div>
                <p className="text-[11px] text-stone-600 font-light leading-relaxed">
                  I absolutely love the {proposalThemeName || "Japandi Classic Space"} proposal! That color palette works super well with natural morning light. Are those built-in carpentry systems customizable for standard 4-room flats?
                </p>
              </div>
            </div>

            {/* Mock Comment 2 */}
            <div className="flex gap-3 pl-6">
              <div className="w-8 h-8 rounded-full bg-[#C47A5C] text-white text-[10px] font-mono font-bold flex items-center justify-center shrink-0">
                A
              </div>
              <div className="flex-1 bg-white border border-stone-150 p-3 rounded-xl">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-stone-700">Atelier Studio Lead</span>
                  <span className="text-[9px] text-stone-400 font-mono">1 hr ago</span>
                </div>
                <p className="text-[11px] text-stone-600 font-light leading-relaxed">
                  Yes, Lionel! The entire partition line is modular. Standard Singapore HDB structures can readily adapt to the layout plan.
                </p>
              </div>
            </div>

            {/* Mock Comment Form placeholder */}
            <div className="pt-2 border-t border-dashed border-stone-200">
              <div className="bg-white border border-stone-200 rounded-xl p-3 flex items-center justify-between gap-3">
                <span className="text-[11px] text-stone-400 font-light">Join the live discussion on {proposalThemeName || "Atelier Blueprints"}...</span>
                <button 
                  onClick={handleOpenNewTab}
                  className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 font-mono text-[9px] font-bold rounded-lg transition duration-200 flex items-center gap-1 cursor-pointer"
                >
                  Authorize Disqus <ExternalLink className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (loadError) {
    return fallbackUI;
  }

  return (
    <div className="min-h-[250px] text-left">
      <div id="disqus_thread" />
    </div>
  );
}
