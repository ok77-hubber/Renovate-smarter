import React, { useState, useEffect } from "react";
import { 
  Home, Sparkles, AlertCircle, CheckCircle, Upload, HelpCircle, 
  ArrowRight, ShieldCheck, RefreshCw, Layers, MapPin, DollarSign, 
  Compass, Eye, Heart, ListPlus, CreditCard, ChevronRight, X,
  History, ChevronDown, Search, Hammer, Briefcase
} from "lucide-react";
import Header from "./components/Header";
import { RenovateInputs, RenovateProposal, PricingPlanTier } from "./types";
import { supabase } from "./supabase";
import DisqusWrapper from "./components/DisqusWrapper";

// Premade Floor Plan Templates for immediate instant testing
const DEMO_FLOOR_PLANS = [
  {
    id: "hdb-3bed",
    name: "Standard 3-Bedroom Flat Layout",
    url: "https://images.weserv.nl/?url=https://commons.wikimedia.org/wiki/Special:FilePath/Block_142_HDB_Potong_Pasir.jpg",
    desc: "Typical 90sqm modular space grid with dual balconies."
  },
  {
    id: "condo-loft",
    name: "Compact Condo Studio Loft",
    url: "https://images.weserv.nl/?url=https://commons.wikimedia.org/wiki/Special:FilePath/Heritage_View,_Singapore_-_20130317.jpg",
    desc: "Double-height vertical volume with high natural breeze access."
  },
  {
    id: "landed-multi",
    name: "Multi-Storey Landed Terrace",
    url: "https://images.weserv.nl/?url=https://commons.wikimedia.org/wiki/Special:FilePath/Houses_on_Victoria_Park_Grove_in_Leedon_Park.jpg",
    desc: "Expansive linear configuration emphasizing spatial transitions."
  }
];

const PRESET_COLOR_SCHEMES = [
  { name: "Japandi Classic", bg: "#F4EFEB", text: "#3E3B39", desc: "Warm timbers paired with linen and soft bone whites." },
  { name: "Slate Minimalist", bg: "#EAECEE", text: "#1F2327", desc: "Monochromatic stone, industrial charcoal, and concrete tones." },
  { name: "Emerald Botanical", bg: "#EBF1ED", text: "#223F2B", desc: "De-saturated sage, rich olive, and polished brass accents." },
  { name: "Terracotta Earth", bg: "#F8ECE6", text: "#783B25", desc: "Baked clay bricks, soft sand, and natural rattan elements." },
  { name: "Celestial Dusk", bg: "#EFF2F7", text: "#1A2536", desc: "Atmospheric twilight blue blended with warm zinc and steel." }
];

const SINGAPORE_TOWNS: Record<string, string[]> = {
  "Central Region": [
    "Ang Mo Kio",
    "Bishan",
    "Bukit Merah",
    "Bukit Timah",
    "Geylang",
    "Kallang/Whampoa",
    "Marine Parade",
    "Novena",
    "Outram",
    "Queenstown",
    "Toa Payoh"
  ],
  "North-East Region": [
    "Hougang",
    "Punggol",
    "Sengkang",
    "Serangoon"
  ],
  "North Region": [
    "Lim Chu Kang",
    "Sembawang",
    "Woodlands",
    "Yishun"
  ],
  "East Region": [
    "Bedok",
    "Changi",
    "Pasir Ris",
    "Tampines"
  ],
  "West Region": [
    "Bukit Batok",
    "Bukit Panjang",
    "Choa Chu Kang",
    "Clementi",
    "Jurong East",
    "Jurong West",
    "Tengah"
  ]
};

export default function App() {
  // Application Tiers and pricing details
  const pricingPlans: PricingPlanTier[] = [
    {
      id: "free",
      name: "Essential",
      price: "$0",
      period: "forever",
      description: "Ideal for light initial exploration before investing in deep custom projects.",
      features: [
        "1 Custom AI Recommendation Layout",
        "Interactive 2D Space Map View",
        "Requires Mandatory Account Sign-up",
        "Standard Proposal PDF Summary"
      ],
      recommendationLimit: 1,
      actionText: "Select Free Starter"
    },
    {
      id: "basic_10",
      name: "Studio Standard",
      price: "$10",
      period: "one-time",
      description: "Perfect for core family renovations looking for optimized space trade-offs.",
      features: [
        "3 Premium AI Design Recommendations",
        "Full Side-by-side Layout Comparisons",
        "Feng Shui Space Flow Harmonization",
        "Prioritized Server Generation Priority",
        "Direct Color Block Palette Exports"
      ],
      recommendationLimit: 3,
      actionText: "Get Studio Standard",
      isPopular: true
    },
    {
      id: "pro_30",
      name: "Architect Elite",
      price: "$30",
      period: "one-time",
      description: "Comprehensive blueprint spatial optimization for advanced properties or full overhauls.",
      features: [
        "10 Complete Space Design Proposals",
        "Dual-Option Furniture Density Diagrams",
        "Eco-Thermal Insulation Energy Projections",
        "Full Materials & Finishes Cost Estimates",
        "Direct Support with Premium Studio Architects"
      ],
      recommendationLimit: 10,
      actionText: "Upgrade to Architect Elite"
    }
  ];

  // User details, tracked in state & persistent client storage
  const [userAccount, setUserAccount] = useState<{
    name: string;
    email: string;
    plan: string;
    recommendationsCount: number;
    maxRecommendations: number;
  } | null>(() => {
    const saved = localStorage.getItem("workspace_user_auth_sm");
    return saved ? JSON.parse(saved) : null;
  });

  const [activeTab, setActiveTab] = useState<"planner" | "pricing" | "history">("planner");
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authType, setAuthType] = useState<"login" | "register">("register");
  
  // Registration form elements
  const [authName, setAuthName] = useState("");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authPlanSelection, setAuthPlanSelection] = useState("free");

  // Custom checkout / upgrade modal
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
  const [selectedPlanForCheckout, setSelectedPlanForCheckout] = useState<PricingPlanTier | null>(null);
  const [cardHolderName, setCardHolderName] = useState("");
  const [cardNumber, setCardNumber] = useState("");

  // Contractor matching state
  const [contractorModalOpen, setContractorModalOpen] = useState(false);
  const [isContractorCheckedOut, setIsContractorCheckedOut] = useState(false);

  // Geographic Context Custom Dropdown state
  const [isLocationDropdownOpen, setIsLocationDropdownOpen] = useState(false);
  const [locationSearchQuery, setLocationSearchQuery] = useState("");

  // Input states for the Renovator Builder
  const [inputs, setInputs] = useState<RenovateInputs>({
    housingType: "HDB / Apartment",
    location: "Sengkang",
    budget: 45000,
    scope: "rooms",
    roomsSelected: ["Living Room", "Kitchen"],
    colorScheme: "Japandi Classic",
    otherPreferences: "We love bright, airy open passages with custom storage benches. Feng Shui stove alignment is vital.",
    uploadedPlanUrl: "",
    uploadedPlanName: "",
    uploadedMoodBoardUrl: "",
    uploadedMoodBoardName: "",
    pricingPlan: "free",
    wantContractorConnect: false
  });

  // Flow State
  const [isGenerating, setIsGenerating] = useState(false);
  const [proposalResult, setProposalResult] = useState<RenovateProposal | null>(null);
  
  // Quick error messaging fallback
  const [errorMessage, setErrorMessage] = useState("");

  // Active view inside proposal: options selection (A vs B)
  const [selectedLayoutOption, setSelectedLayoutOption] = useState<"optionA" | "optionB">("optionA");
  const [hoveredRoom, setHoveredRoom] = useState<string | null>(null);

  // Design Refinement states
  const [iterationCount, setIterationCount] = useState<number>(0);
  const [refinementFeedback, setRefinementFeedback] = useState("");
  const [feedbackHistory, setFeedbackHistory] = useState<string[]>([]);
  const [isRefining, setIsRefining] = useState(false);
  const [colorSource, setColorSource] = useState<"preset" | "moodboard">("preset");
  const [isMoodboardDragging, setIsMoodboardDragging] = useState(false);

  // Real-time design stream state
  const [entries, setEntries] = useState<any[]>([]);
  const [isLoadingEntries, setIsLoadingEntries] = useState(false);

  // Sync session authentication state with client storage
  useEffect(() => {
    if (userAccount) {
      localStorage.setItem("workspace_user_auth_sm", JSON.stringify(userAccount));
    } else {
      localStorage.removeItem("workspace_user_auth_sm");
    }
  }, [userAccount]);

  // Fetch entries from Supabase + Subscribe to real-time additions
  useEffect(() => {
    let active = true;

    const fetchAllEntries = async () => {
      setIsLoadingEntries(true);
      try {
        const { data, error } = await supabase
          .from("entries")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(40);

        if (error) {
          console.error("Supabase select error:", error);
        } else if (data && active) {
          setEntries(data);
          
          // If we don't have an active proposalResult, load the absolute latest one from the stream!
          // This keeps the workspace populated on first visit with the latest beautiful creation!
          if (data.length > 0) {
            const latest = data[0];
            setProposalResult(latest.proposal);
            setIterationCount(level => latest.iteration_count || level);
            setFeedbackHistory(history => latest.feedback_history || history);
            if (latest.inputs) {
              setInputs(latest.inputs);
            }
          }
        }
      } catch (err) {
        console.error("Err fetching Supabase entries:", err);
      } finally {
        if (active) setIsLoadingEntries(false);
      }
    };

    fetchAllEntries();

    // Live subscription! Real-time channel with .channel().on()
    const channel = supabase
      .channel("live_entries")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "entries" },
        (payload) => {
          if (active) {
            setEntries((prev) => {
              // Ensure we don't push duplicates
              const exists = prev.some((e) => e.id === payload.new.id);
              if (exists) return prev;
              return [payload.new, ...prev];
            });
          }
        }
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, []);

  // Close custom dropdown when clicking outside
  useEffect(() => {
    if (!isLocationDropdownOpen) return;
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest("#location-dropdown-wrapper")) {
        setIsLocationDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [isLocationDropdownOpen]);

  // Handle preset room selections toggle (multi-select)
  const toggleRoomSelection = (room: string) => {
    if (inputs.roomsSelected.includes(room)) {
      setInputs(prev => ({
        ...prev,
        roomsSelected: prev.roomsSelected.filter(r => r !== room)
      }));
    } else {
      setInputs(prev => ({
        ...prev,
        roomsSelected: [...prev.roomsSelected, room]
      }));
    }
  };

  // Convert uploaded plan to base64
  const handleFloorPlanUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setInputs(prev => ({
          ...prev,
          uploadedPlanUrl: reader.result as string,
          uploadedPlanName: file.name
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Drag and drop support
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setInputs(prev => ({
          ...prev,
          uploadedPlanUrl: reader.result as string,
          uploadedPlanName: file.name
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleMoodboardDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsMoodboardDragging(true);
  };

  const handleMoodboardDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsMoodboardDragging(false);
  };

  const handleMoodboardDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsMoodboardDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setInputs(prev => ({
          ...prev,
          colorScheme: `Custom Moodboard [${file.name}]`,
          uploadedMoodBoardUrl: reader.result as string,
          uploadedMoodBoardName: file.name
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Select demo template
  const selectDemoPlan = (demo: typeof DEMO_FLOOR_PLANS[0]) => {
    setInputs(prev => ({
      ...prev,
      uploadedPlanUrl: demo.url,
      uploadedPlanName: demo.name
    }));
  };

  // User Auth functions
  const handleAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!authEmail.trim()) return;

    const chosenTier = pricingPlans.find(p => p.id === authPlanSelection) || pricingPlans[0];
    
    // Create new simulated account
    const newAccount = {
      name: authName.trim() || authEmail.split("@")[0],
      email: authEmail,
      plan: authPlanSelection,
      recommendationsCount: 0,
      maxRecommendations: chosenTier.recommendationLimit
    };

    setUserAccount(newAccount);
    setAuthModalOpen(false);
    
    // Clear forms
    setAuthName("");
    setAuthEmail("");
    setAuthPassword("");
  };

  const handleLogout = () => {
    setUserAccount(null);
    localStorage.removeItem("workspace_user_auth_sm");
  };

  // Pricing click activation
  const handleSelectPlan = (plan: PricingPlanTier) => {
    if (plan.id === "free") {
      // If free and not logged in, trigger signup modal favoring free-tier
      if (!userAccount) {
        setAuthPlanSelection("free");
        setAuthType("register");
        setAuthModalOpen(true);
      } else {
        // Change user account's current active plan level
        setUserAccount(prev => prev ? {
          ...prev,
          plan: "free",
          maxRecommendations: 1
        } : null);
      }
    } else {
      // Paid plan -> open payment checkout simulator
      setSelectedPlanForCheckout(plan);
      setCardHolderName(userAccount?.name || "");
      setCheckoutModalOpen(true);
    }
  };

  // Finalize paid plan checkout simulation
  const handleCheckoutSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlanForCheckout) return;

    if (userAccount) {
      // Upgrade existing account setup
      setUserAccount(prev => prev ? {
        ...prev,
        plan: selectedPlanForCheckout.id,
        // Boost limits
        maxRecommendations: selectedPlanForCheckout.recommendationLimit,
        // Reset count to allow fresh starts
        recommendationsCount: 0
      } : null);
    } else {
      // Prompt creation with preloaded paid plan
      setAuthPlanSelection(selectedPlanForCheckout.id);
      setAuthType("register");
      setAuthModalOpen(true);
    }

    setCheckoutModalOpen(false);
    setSelectedPlanForCheckout(null);
  };

  // Handle collaborative feedback refinements up to 3 iteration cycles
  const handleRefinedSubmission = async () => {
    if (!refinementFeedback.trim() || !proposalResult) return;
    setIsRefining(true);
    setErrorMessage("");

    try {
      const nextIteration = iterationCount + 1;
      const response = await fetch("/api/refine-proposal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inputs: {
            ...inputs,
            roomsSelected: inputs.scope === "whole" ? ["Living", "Kitchen", "Bedrooms", "Foyer"] : inputs.roomsSelected,
          },
          previousProposal: proposalResult,
          refinementFeedback: refinementFeedback.trim(),
          iterationCount: nextIteration
        })
      });

      if (!response.ok) {
        throw new Error("Refinement server returned code: " + response.status);
      }

      const updatedProposal: RenovateProposal = await response.json();
      setProposalResult(updatedProposal);
      
      const newHistoryList = [...feedbackHistory, refinementFeedback.trim()];
      setFeedbackHistory(newHistoryList);
      setIterationCount(nextIteration);
      setRefinementFeedback("");

      // Save design entry to Supabase table 'entries'
      const entryData = {
        user_email: userAccount?.email || "guest@renovatesmarter.com",
        user_name: userAccount?.name || "Guest Designer",
        inputs: inputs,
        proposal: updatedProposal,
        feedback_history: newHistoryList,
        iteration_count: nextIteration,
        created_at: new Date().toISOString()
      };

      try {
        await supabase.from("entries").insert([entryData]);
      } catch (err) {
        console.error("Failed to save refined iteration to Supabase:", err);
      }

      // Scroll to proposal theme name immediately
      setTimeout(() => {
        document.getElementById("proposal-concept-box")?.scrollIntoView({ behavior: "smooth" });
      }, 100);

    } catch (err: any) {
      console.error(err);
      setErrorMessage("Could not refine proposal layout. Code: " + (err?.message || "RefineError"));
    } finally {
      setIsRefining(false);
    }
  };

  // Trigger main Proposal generation via Express backend (proxying Gemini AI)
  const handleGenerateProposal = async () => {
    setErrorMessage("");

    // Reset layout refinements for a fresh generation session
    setIterationCount(0);
    setFeedbackHistory([]);
    setRefinementFeedback("");

    // Limit check safety logic
    const currentTier = userAccount ? userAccount.plan : "guest_unregistered";
    const usedCount = userAccount ? userAccount.recommendationsCount : 0;
    const maxLimit = userAccount ? userAccount.maxRecommendations : 0; // Guest count is zero layout limit, forces registration or upgrade

    // 1. Unregistered limit barrier
    if (!userAccount) {
      setErrorMessage("To generate custom spatial proposals under the Free Essential plan, you must first create a free account. Click below to sign up instantly.");
      setAuthPlanSelection("free");
      setAuthType("register");
      setAuthModalOpen(true);
      return;
    }

    // 2. Limit exhaustion check
    if (usedCount >= maxLimit) {
      setErrorMessage(`You have reached the maximum recommendation limit for the ${userAccount.plan === "free" ? "Free Starter" : userAccount.plan === "basic_10" ? "Standard" : "Pro"} tier (${usedCount}/${maxLimit} Used). Please upgrade your tier or register a premium key to unlock more credits.`);
      setActiveTab("pricing");
      return;
    }

    setIsGenerating(true);

    try {
      // Call server side API proxying Gemini API beautifully
      const response = await fetch("/api/generate-proposal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          housingType: inputs.housingType,
          location: inputs.location,
          budget: inputs.budget,
          scope: inputs.scope,
          roomsSelected: inputs.scope === "whole" ? ["Living", "Kitchen", "Bedrooms", "Foyer"] : inputs.roomsSelected,
          colorScheme: inputs.colorScheme,
          otherPreferences: inputs.otherPreferences,
          uploadedPlanUrl: inputs.uploadedPlanUrl,
          uploadedMoodBoardUrl: inputs.uploadedMoodBoardUrl
        })
      });

      if (!response.ok) {
        throw new Error("Server responded with code: " + response.status);
      }

      const proposalData: RenovateProposal = await response.json();
      setProposalResult(proposalData);
      
      // Increment recommendation usage
      setUserAccount(prev => prev ? {
        ...prev,
        recommendationsCount: prev.recommendationsCount + 1
      } : null);

      // Save design entry to Supabase table 'entries'
      const generatedInputs = {
        ...inputs,
        roomsSelected: inputs.scope === "whole" ? ["Living", "Kitchen", "Bedrooms", "Foyer"] : inputs.roomsSelected
      };

      const entryData = {
        user_email: userAccount?.email || "guest@renovatesmarter.com",
        user_name: userAccount?.name || "Guest Designer",
        inputs: generatedInputs,
        proposal: proposalData,
        feedback_history: [],
        iteration_count: 0,
        created_at: new Date().toISOString()
      };

      try {
        await supabase.from("entries").insert([entryData]);
      } catch (err) {
        console.error("Failed to save new proposal to Supabase:", err);
      }

      // Scroll smoothly down to the proposal content container
      setTimeout(() => {
        document.getElementById("proposal-concept-box")?.scrollIntoView({ behavior: "smooth" });
      }, 150);

    } catch (e: any) {
      console.error(e);
      setErrorMessage("Failed to generate recommendations. Please try again. Code: " + (e?.message || "GenError"));
    } finally {
      setIsGenerating(false);
    }
  };

  // Quick reset
  const handleResetForm = () => {
    setInputs({
      housingType: "HDB / Apartment",
      location: "Sengkang",
      budget: 50000,
      scope: "whole",
      roomsSelected: [],
      colorScheme: "Japandi Classic",
      otherPreferences: "",
      uploadedPlanUrl: "",
      uploadedPlanName: "",
      uploadedMoodBoardUrl: "",
      uploadedMoodBoardName: "",
      pricingPlan: "free",
      wantContractorConnect: false
    });
    setProposalResult(null);
    setIterationCount(0);
    setFeedbackHistory([]);
    setRefinementFeedback("");
  };

  // Filter Singapore towns dynamically based on the dropdown search query
  const filteredTowns = Object.entries(SINGAPORE_TOWNS).reduce((acc, [region, towns]) => {
    const matched = towns.filter(town => town.toLowerCase().includes(locationSearchQuery.toLowerCase()));
    if (matched.length > 0) {
      acc[region] = matched;
    }
    return acc;
  }, {} as Record<string, string[]>);

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#1A1A1A] flex flex-col antialiased">
      <Header
        onGoHome={() => setActiveTab("planner")}
        onShowPricing={() => setActiveTab("pricing")}
        onShowHistory={() => setActiveTab("history")}
        activeTab={activeTab}
        userAccount={userAccount}
        onLogout={handleLogout}
        savedProposalsCount={userAccount ? userAccount.recommendationsCount : 0}
      />

      {/* Hero Welcome Announcement */}
      <section className="bg-[#1C242B] text-white py-12 px-4 shadow-sm border-b border-stone-800">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-xl">
            <span className="text-[10px] uppercase tracking-[0.2em] font-mono text-[#C47A5C] font-bold block mb-2">01. Studio Atelier Hub</span>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-serif tracking-tight leading-tight mb-3">
              Renovate <span className="font-serif italic text-[#FAF9F6]">Smarter</span>.
            </h1>
            <p className="text-stone-300 text-sm sm:text-base font-light leading-relaxed">
              Design exquisite spatial flows, customized 2D mock maps, and balance your budget. Infused with practical Feng Shui directives and sustainable thermal solar guidelines.
            </p>
          </div>
          <div className="bg-white/5 border border-white/10 p-5 rounded-2xl max-w-sm w-full backdrop-blur-sm">
            <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-3">
              <span className="text-xs uppercase font-mono tracking-widest text-[#C47A5C] font-semibold">Active Tier Limit</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-[#C47A5C] text-white">
                {userAccount ? userAccount.plan.toUpperCase() : "GUEST"}
              </span>
            </div>
            
            {userAccount ? (
              <div>
                <p className="text-xs text-stone-200">Logged in as <strong className="text-white">{userAccount.name}</strong></p>
                <div className="mt-3">
                  <div className="flex justify-between text-xs text-stone-400 mb-1">
                    <span>Generated Layouts</span>
                    <span>{userAccount.recommendationsCount} / {userAccount.maxRecommendations}</span>
                  </div>
                  <div className="w-full bg-stone-800 rounded-full h-1.5 overflow-hidden">
                    <div 
                      className="bg-[#C47A5C] h-1.5 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, (userAccount.recommendationsCount / userAccount.maxRecommendations) * 100)}%` }}
                    />
                  </div>
                </div>
                {userAccount.plan === "free" && (
                  <button 
                    onClick={() => setActiveTab("pricing")}
                    className="w-full text-center mt-4 text-xs text-[#FAF9F6] bg-amber-800/40 hover:bg-[#C47A5C] py-2 rounded-lg font-medium border border-[#C47A5C]/40 transition"
                  >
                    Upgrade Plan to Unlock 10 Limits
                  </button>
                )}
              </div>
            ) : (
              <div>
                <p className="text-xs text-stone-300 leading-relaxed">
                  You are exploring as a Guest. Register an account to enable free blueprint generation.
                </p>
                <button 
                  onClick={() => {
                    setAuthType("register");
                    setAuthPlanSelection("free");
                    setAuthModalOpen(true);
                  }}
                  className="w-full mt-4 bg-[#C47A5C] hover:bg-[#b0674a] text-white text-xs py-2 rounded-lg font-semibold tracking-wider uppercase transition"
                >
                  Create Instant Free Account
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Main Tab Routing */}
      {activeTab === "planner" && (
        <main className="flex-1 w-full max-w-7xl mx-auto px-4 py-8 sm:py-12 md:px-6">
          
          {errorMessage && (
            <div className="mb-8 p-4 bg-red-50 text-red-800 border border-red-200 rounded-xl flex items-start gap-3 shadow-sm animate-fadeIn" id="global-error-banner">
              <AlertCircle className="w-5 h-5 shrink-0 text-red-600 mt-0.5" />
              <div className="flex-1">
                <span className="font-bold text-sm">System Limitation Met</span>
                <p className="text-xs leading-relaxed mt-1 text-red-700">{errorMessage}</p>
                <button 
                  onClick={() => {
                    if (!userAccount) {
                      setAuthType("register");
                      setAuthModalOpen(true);
                    } else {
                      setActiveTab("pricing");
                    }
                  }}
                  className="mt-2.5 text-xs font-semibold underline text-[#C47A5C] hover:text-[#b0674a] flex items-center gap-1"
                >
                  Resolve limit instantly <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
              <button onClick={() => setErrorMessage("")} className="text-red-500 hover:text-red-800">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Grid Studio System */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-12">
            
            {/* Left Hand: The Form Inputs Configurer */}
            <aside className="lg:col-span-5 bg-white p-6 sm:p-8 rounded-2xl border border-stone-200/60 shadow-sm flex flex-col gap-6">
              
              <div>
                <span className="text-[10px] uppercase tracking-[0.2em] font-mono text-[#C47A5C] font-bold block mb-1">Step 02</span>
                <h2 className="text-2xl font-serif text-[#1C242B]">Project Metadata</h2>
                <div className="h-0.5 w-12 bg-[#1C242B] mt-2" />
              </div>

              {/* 1. Housing Type Selection */}
              <div className="flex flex-col gap-2">
                <label className="text-xs uppercase tracking-widest text-[#6B6B6B] font-bold font-mono">01. Housing Architecture</label>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  {["Landed Property", "Condominium", "HDB / Apartment", "Commercial Space"].map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setInputs(prev => ({ ...prev, housingType: type }))}
                      className={`text-xs px-3 py-2.5 text-left rounded-lg transition-all border duration-200 ${
                        inputs.housingType === type
                          ? "bg-[#1C242B] text-white border-[#1C242B]"
                          : "bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100"
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              {/* 2. Geographic Context Location */}
              <div className="flex flex-col gap-2" id="location-dropdown-wrapper">
                <label className="text-xs uppercase tracking-widest text-[#6B6B6B] font-bold font-mono" htmlFor="location-input">02. Geographic Context</label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-stone-400 absolute left-3 top-3.5 z-10 pointer-events-none" />
                  <button
                    id="location-input"
                    type="button"
                    onClick={() => {
                      setIsLocationDropdownOpen(!isLocationDropdownOpen);
                      setLocationSearchQuery("");
                    }}
                    className="w-full pl-9 pr-10 py-2.5 text-left text-sm bg-stone-50 border-b border-stone-300 focus:outline-none focus:border-[#1C242B] hover:bg-stone-100/50 transition-all flex items-center justify-between cursor-pointer"
                  >
                    <span className="text-stone-800 font-medium">
                      {inputs.location || "Select town / precinct"}
                    </span>
                    <ChevronDown className={`w-4 h-4 text-stone-400 transition-transform duration-200 ${isLocationDropdownOpen ? "rotate-180" : ""}`} />
                  </button>

                  {isLocationDropdownOpen && (
                    <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-stone-200 shadow-xl rounded-xl overflow-hidden max-h-80 flex flex-col transition-all">
                      {/* Search Bar */}
                      <div className="p-2 border-b border-stone-100 flex items-center gap-2 bg-stone-50/50">
                        <Search className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                        <input
                          type="text"
                          placeholder="Search town or region..."
                          value={locationSearchQuery}
                          onChange={(e) => setLocationSearchQuery(e.target.value)}
                          className="w-full bg-transparent text-xs text-stone-800 outline-none focus:ring-0 py-1"
                          autoFocus
                        />
                        {locationSearchQuery && (
                          <button
                            type="button"
                            onClick={() => setLocationSearchQuery("")}
                            className="text-stone-400 hover:text-stone-600 p-0.5"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </div>

                      {/* Dropdown Options */}
                      <div className="overflow-y-auto py-1 flex-1 max-h-60 scrollbar-thin">
                        {Object.keys(filteredTowns).length === 0 ? (
                          <div className="px-4 py-3 text-xs text-stone-400 text-center uppercase tracking-wider">
                            No matching towns found
                          </div>
                        ) : (
                          Object.entries(filteredTowns).map(([region, towns]) => (
                            <div key={region} className="mb-2">
                              {/* Region Header */}
                              <div className="px-3 py-1 text-[10px] uppercase font-mono font-bold tracking-widest text-stone-400 bg-[#FAF9F6]">
                                {region}
                              </div>
                              {/* Towns under Region */}
                              <div className="space-y-0.5 mt-1">
                                {towns.map((town) => {
                                  const isSelected = inputs.location === town;
                                  return (
                                    <button
                                      key={town}
                                      type="button"
                                      onClick={() => {
                                        setInputs(prev => ({ ...prev, location: town }));
                                        setIsLocationDropdownOpen(false);
                                      }}
                                      className={`w-full px-4 py-2 text-left text-xs transition-colors flex items-center justify-between ${
                                        isSelected
                                          ? "bg-[#1C242B] text-white font-medium"
                                          : "text-stone-700 hover:bg-stone-50 hover:text-stone-900"
                                      }`}
                                    >
                                      <span>{town}</span>
                                      {isSelected && <CheckCircle className="w-3.5 h-3.5 text-orange-400" />}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* 3. Renovation Budget */}
              <div className="flex flex-col gap-2 bg-stone-50/50 p-4 rounded-xl border border-stone-200/55">
                <div className="flex justify-between items-baseline mb-1">
                  <label className="text-xs uppercase tracking-widest text-[#6B6B6B] font-bold font-mono" htmlFor="budget-input">03. Renovation budget</label>
                  <span className="text-base font-bold text-[#C47A5C]" data-font="mono">
                    S$ {Number(inputs.budget).toLocaleString("en-SG")} SGD
                  </span>
                </div>
                <input
                  id="budget-input"
                  type="range"
                  min="2000"
                  max="1000000"
                  step="1000"
                  value={inputs.budget}
                  onChange={(e) => setInputs(prev => ({ ...prev, budget: Number(e.target.value) }))}
                  className="w-full h-1 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-stone-400 font-mono mt-1">
                  <span>Min: S$ 2,000</span>
                  <span>Mid: S$ 501,000</span>
                  <span>Max: S$ 1,000,000</span>
                </div>
              </div>

              {/* 4. Project Scope Option */}
              <div className="flex flex-col gap-3">
                <label className="text-xs uppercase tracking-widest text-[#6B6B6B] font-bold font-mono">04. Design Focus Scope</label>
                <div className="flex bg-stone-100 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setInputs(prev => ({ ...prev, scope: "whole" }))}
                    className={`flex-1 text-center text-xs py-2 rounded-lg font-medium transition ${
                      inputs.scope === "whole" ? "bg-white text-[#1C242B] shadow-xs" : "text-stone-500 hover:text-[#1C242B]"
                    }`}
                  >
                    Whole House Renovation
                  </button>
                  <button
                    type="button"
                    onClick={() => setInputs(prev => ({ ...prev, scope: "rooms" }))}
                    className={`flex-1 text-center text-xs py-2 rounded-lg font-medium transition ${
                      inputs.scope === "rooms" ? "bg-white text-[#1C242B] shadow-xs" : "text-stone-500 hover:text-[#1C242B]"
                    }`}
                  >
                    Isolated Rooms & Areas
                  </button>
                </div>

                {inputs.scope === "rooms" && (
                  <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 flex flex-wrap gap-1.5 animate-fadeIn">
                    {["Living Room", "Kitchen", "Master bedroom", "Common bedroom", "Bathrooms", "Foyer & Corridor", "Balcony Garden", "Study & Office"].map((room) => {
                      const selected = inputs.roomsSelected.includes(room);
                      return (
                        <button
                          key={room}
                          type="button"
                          onClick={() => toggleRoomSelection(room)}
                          className={`text-xs px-2.5 py-1.5 rounded-full border transition ${
                            selected 
                              ? "bg-[#C47A5C] text-white border-[#C47A5C]" 
                              : "bg-white text-stone-600 border-stone-200 hover:bg-stone-100"
                          }`}
                        >
                          {selected ? "✓ " : ""}{room}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* 5. Color Scheme Style Palette / Mood Board */}
              <div className="flex flex-col gap-2 bg-stone-50/40 p-4 rounded-xl border border-stone-200/50">
                <div className="flex items-center justify-between border-b border-stone-150 pb-2 mb-2">
                  <label className="text-xs uppercase tracking-widest text-[#6B6B6B] font-bold font-mono">05. Color Aesthetic Mood</label>
                  <div className="flex bg-stone-200 p-0.5 rounded-md">
                    <button
                      type="button"
                      onClick={() => setColorSource("preset")}
                      className={`text-[9px] uppercase tracking-wider px-2.5 py-1 rounded transition-all duration-150 ${
                        colorSource === "preset" ? "bg-white text-stone-800 font-bold shadow-xs" : "text-stone-600 hover:text-stone-800"
                      }`}
                    >
                      Presets
                    </button>
                    <button
                      type="button"
                      onClick={() => setColorSource("moodboard")}
                      className={`text-[9px] uppercase tracking-wider px-2.5 py-1 rounded transition-all duration-150 ${
                        colorSource === "moodboard" ? "bg-white text-stone-800 font-bold shadow-xs" : "text-stone-600 hover:text-stone-800 font-semibold"
                      }`}
                    >
                      Mood Board
                    </button>
                  </div>
                </div>

                {colorSource === "preset" ? (
                  <div className="space-y-2 animate-fadeIn">
                    <select
                      value={inputs.colorScheme}
                      onChange={(e) => setInputs(prev => ({ ...prev, colorScheme: e.target.value }))}
                      className="w-full bg-white border border-stone-200 py-2 px-2.5 rounded-lg text-xs tracking-wide focus:outline-none"
                    >
                      {PRESET_COLOR_SCHEMES.map((scheme) => (
                        <option key={scheme.name} value={scheme.name}>
                          {scheme.name} — ({scheme.desc.split(" ").slice(0, 3).join(" ")}...)
                        </option>
                      ))}
                    </select>
                    {/* Visual strip preview */}
                    <div className="flex h-3 w-full rounded-md overflow-hidden gap-0.5 border border-stone-200">
                      {PRESET_COLOR_SCHEMES.find(s => s.name === inputs.colorScheme) ? (
                        PRESET_COLOR_SCHEMES.map((sc, i) => (
                          <span key={i} className="flex-1 transition" style={{ backgroundColor: sc.bg }} title={sc.name} />
                        ))
                      ) : (
                        <span className="flex-1 bg-gradient-to-r from-stone-400 to-amber-700" />
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2 animate-fadeIn">
                    {inputs.uploadedMoodBoardUrl ? (
                      <div className="bg-white border border-stone-200/85 p-2 rounded-lg flex items-center justify-between gap-3 text-xs">
                        <div className="flex items-center gap-2 min-w-0">
                          <img
                            src={inputs.uploadedMoodBoardUrl}
                            alt="Moodboard thumbnail"
                            className="w-10 h-10 object-cover rounded border border-stone-200"
                          />
                          <div className="flex flex-col min-w-0">
                            <span className="font-semibold text-stone-800 truncate max-w-[130px]">{inputs.uploadedMoodBoardName || "Moodboard file"}</span>
                            <span className="text-[10px] text-[#5B6D5E]">Ready for custom AI extraction</span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setInputs(prev => ({ ...prev, colorScheme: "Japandi Classic", uploadedMoodBoardUrl: "", uploadedMoodBoardName: "" }))}
                          className="text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 p-1.5 rounded transition"
                          title="Remove custom scheme"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <div 
                        onDragOver={handleMoodboardDragOver}
                        onDragLeave={handleMoodboardDragLeave}
                        onDrop={handleMoodboardDrop}
                        className={`border-2 border-dashed rounded-lg p-5 text-center transition-all duration-300 relative cursor-pointer ${
                          isMoodboardDragging 
                            ? "border-[#C47A5C] bg-amber-50/40 scale-[0.99]" 
                            : "border-stone-300 bg-white hover:border-[#C47A5C] hover:bg-stone-50/40"
                        }`}
                      >
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onloadend = () => {
                                setInputs(prev => ({
                                  ...prev,
                                  colorScheme: `Custom Moodboard [${file.name}]`,
                                  uploadedMoodBoardUrl: reader.result as string,
                                  uploadedMoodBoardName: file.name
                                }));
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                        <Upload className={`w-5 h-5 mx-auto mb-1.5 transition-colors duration-200 ${isMoodboardDragging ? "text-[#C47A5C]" : "text-stone-400"}`} />
                        <span className="text-xs font-semibold text-stone-700 block">
                          {isMoodboardDragging ? "Drop your mood board here!" : "Upload custom mood board image"}
                        </span>
                        <span className="text-[9px] text-stone-400 block mt-0.5">Drag & drop or click to browse files (PNG, JPG, SVG styles)</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* 6. Other / Feng Shui Custom requirements */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs uppercase tracking-widest text-[#6B6B6B] font-bold font-mono" htmlFor="preferences-textarea">06. Bespoke Spatial Notes</label>
                <textarea
                  id="preferences-textarea"
                  rows={3}
                  value={inputs.otherPreferences}
                  onChange={(e) => setInputs(prev => ({ ...prev, otherPreferences: e.target.value }))}
                  placeholder="e.g. Master bed headboard alignment, pet friendly paths, low-E glass options, maximum hidden carpentry..."
                  className="w-full bg-stone-50 border border-stone-200 rounded-lg text-xs p-3 focus:outline-none focus:border-[#C47A5C] transition-all bg-white"
                />
              </div>

              {/* 7. Verified Builder Matchmaking */}
              <div className="flex flex-col gap-2 bg-[#F5EFE6]/50 p-4 rounded-xl border border-[#D5C29D]/40">
                <div className="flex items-center gap-1.5">
                  <Hammer className="w-3.5 h-3.5 text-[#C47A5C]" />
                  <label className="text-xs uppercase tracking-widest text-[#1C242B] font-bold font-mono">07. Builder Connection</label>
                </div>
                <p className="text-[10px] text-stone-600 leading-normal">
                  Connect with vetted HDB-licensed, CaseTrust-certified Singapore boutique contractors. Skip the renovation horror stories.
                </p>
                <button
                  type="button"
                  onClick={() => setInputs(prev => ({ ...prev, wantContractorConnect: !prev.wantContractorConnect }))}
                  className={`w-full text-left p-3 rounded-lg border transition-all flex items-start gap-2.5 cursor-pointer ${
                    inputs.wantContractorConnect 
                      ? "bg-[#1C242B] border-[#1C242B] text-white shadow-sm" 
                      : "bg-white border-stone-200 text-stone-700 hover:border-[#C47A5C] hover:bg-stone-50"
                  }`}
                >
                  <div className={`w-4 h-4 rounded-md mt-0.5 border flex items-center justify-center shrink-0 ${
                    inputs.wantContractorConnect 
                      ? "bg-[#C47A5C] border-[#C47A5C] text-white" 
                      : "bg-stone-50 border-stone-300 text-transparent"
                  }`}>
                    ✓
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-xs font-bold block">
                      Connect Me with Vetted Builders
                    </span>
                    <span className={`text-[9px] block mt-0.5 ${
                      inputs.wantContractorConnect ? "text-amber-200" : "text-[#C47A5C] font-semibold"
                    }`}>
                      Nominal compilation fee of $15 SGD
                    </span>
                  </div>
                </button>
              </div>

              {/* Action trigger button */}
              <button
                type="button"
                onClick={handleGenerateProposal}
                disabled={isGenerating}
                className="w-full text-xs font-mono tracking-widest uppercase py-3 border-2 border-[#1C242B] bg-[#1C242B] hover:bg-[#C47A5C] hover:border-[#C47A5C] text-white rounded-xl transition duration-300 flex items-center justify-center gap-2 font-bold cursor-pointer disabled:opacity-50"
                id="generate-proposal-trigger"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-white" />
                    Analyzing Blueprints... (60s)
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Atelier AI Proposal Generator
                  </>
                )}
              </button>

              <div className="text-[10px] text-center text-stone-400 flex items-center justify-center gap-2 uppercase tracking-wide">
                <ShieldCheck className="w-4 h-4 text-[#5B6D5E]" />
                Premium Singapore Studio Quality
              </div>

            </aside>

            {/* Right Hand: Floor Plan Asset Loader + Live Proposal Panel */}
            <section className="lg:col-span-7 flex flex-col gap-8">
              
              {/* Floor Plan Asset Loader */}
              <div 
                className="bg-white rounded-2xl p-6 sm:p-8 border border-stone-200/60 shadow-sm flex flex-col gap-6"
                onDragOver={handleDragOver}
                onDrop={handleDrop}
              >
                <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                  <div>
                    <span className="text-[10px] uppercase tracking-[0.2em] font-mono text-[#C47A5C] font-bold block">03. Visual Blueprint</span>
                    <h3 className="text-xl font-serif text-[#1C242B]">Floor Plan & Design Scheme Asset</h3>
                  </div>
                  {inputs.uploadedPlanUrl && (
                    <button
                      onClick={() => setInputs(prev => ({ ...prev, uploadedPlanUrl: "", uploadedPlanName: "" }))}
                      className="text-xs text-red-600 hover:underline flex items-center gap-1"
                    >
                      Reset File
                    </button>
                  )}
                </div>

                {inputs.uploadedPlanUrl ? (
                  <div className="bg-stone-50 border border-stone-200 rounded-xl p-4 flex flex-col sm:flex-row items-center gap-4 animate-fadeIn">
                    <img
                      src={inputs.uploadedPlanUrl}
                      alt="Floor plan Preview"
                      className="w-24 h-24 object-cover rounded-lg border border-stone-300 shadow-sm shrink-0"
                    />
                    <div className="text-center sm:text-left flex-1 min-w-0">
                      <p className="text-sm font-semibold text-stone-800 truncate" id="file-title-indicator">
                        {inputs.uploadedPlanName || "Uploaded Workspace Floorplan"}
                      </p>
                      <p className="text-xs text-[#5B6D5E] font-medium mt-1">✓ Loaded successfully and ready for custom AI spatial zoning.</p>
                    </div>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-stone-300 rounded-xl p-8 text-center hover:border-[#C47A5C] bg-stone-50/50 hover:bg-stone-50 transition duration-300 relative group cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFloorPlanUpload}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      id="floor-plan-upload-field"
                    />
                    <Upload className="w-10 h-10 text-stone-400 mx-auto mb-3 group-hover:text-[#C47A5C] transition duration-200" />
                    <p className="text-sm font-semibold text-stone-700">Drag & drop your property Floor Plan layout file here</p>
                    <p className="text-xs text-stone-400 mt-1">Supports standard PNG, JPEG, GIF or vector snapshots</p>
                  </div>
                )}

                {/* Instant Premade Selectors */}
                <div>
                  <span className="text-[10px] uppercase tracking-widest text-stone-400 font-bold block mb-2.5">No architectural sketch file? Select standard demo archetype:</span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {DEMO_FLOOR_PLANS.map((demo) => (
                      <div
                        key={demo.id}
                        onClick={() => selectDemoPlan(demo)}
                        className={`border rounded-xl p-3 text-left cursor-pointer transition relative group ${
                          inputs.uploadedPlanUrl === demo.url 
                            ? "border-[#C47A5C] bg-[#FAF7F2]/60" 
                            : "border-stone-200 hover:border-stone-400 bg-white"
                        }`}
                      >
                        <div className="h-16 w-full rounded lg overflow-hidden mb-2 bg-stone-200 border border-stone-100">
                          <img src={demo.url} alt={demo.name} className="w-full h-full object-cover group-hover:scale-105 transition" />
                        </div>
                        <span className="text-xs font-semibold text-stone-800 line-clamp-1">{demo.name}</span>
                        <p className="text-[10px] text-stone-500 mt-1 line-clamp-1">{demo.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

              {/* Proposal Loading State placeholder */}
              {isGenerating && (
                <div className="bg-[#1C242B] text-white p-8 sm:p-12 rounded-3xl text-center border border-stone-800 shadow-lg flex flex-col items-center justify-center gap-4 animate-pulse">
                  <RefreshCw className="w-10 h-10 animate-spin text-[#C47A5C]" />
                  <h4 className="text-2xl font-serif">Synthesizing Creative Blueprints</h4>
                  <p className="text-stone-300 text-xs sm:text-sm max-w-md mx-auto leading-relaxed font-light">
                    Your floor plan is being parsed with smart spatial logic, cross-checked with active Feng Shui guidelines and green thermal ventilation models...
                  </p>
                </div>
              )}

              {/* Proposed Result Output Block */}
              {proposalResult && !isGenerating && (
                <div 
                  className="bg-white rounded-2xl border border-stone-200/60 shadow-sm overflow-hidden flex flex-col animate-slideUp"
                  id="proposal-concept-box"
                >
                  {/* Decorative Banner */}
                  <div className="bg-[#1C242B] text-white py-6 px-6 sm:px-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <span className="text-[10px] uppercase tracking-[0.25em] font-mono text-[#C47A5C] font-bold">Concept Theme Released</span>
                      <h4 className="text-2.5xl font-serif" id="proposal-theme-name">{proposalResult.themeName}</h4>
                    </div>
                    {/* Color bar preview */}
                    <div className="flex flex-col gap-1 items-end shrink-0">
                      <span className="text-[10px] font-mono text-stone-400">Color Palette</span>
                      <div className="flex gap-1.5 h-6">
                        {proposalResult.palette?.colors?.map((c, i) => (
                          <div 
                            key={i} 
                            className="w-6 h-6 rounded-md shadow-xs cursor-pointer border border-stone-500/20" 
                            style={{ backgroundColor: c }}
                            title={`Click to copy: ${c}`}
                            onClick={() => {
                              navigator.clipboard.writeText(c);
                              alert(`Copied hex: ${c}`);
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-6 sm:p-8 flex flex-col gap-8">
                    
                    {/* Overall Summary Description */}
                    <div>
                      <p className="text-sm sm:text-base font-serif italic text-stone-700 leading-relaxed">
                        &ldquo;{proposalResult.overallSummary}&rdquo;
                      </p>
                      <p className="text-xs text-[#5B6D5E] font-medium mt-3 flex items-center gap-1">
                        <CheckCircle className="w-4 h-4 text-[#5B6D5E]" />
                        Color Palette Rationale: {proposalResult.palette?.description}
                      </p>
                    </div>

                    {/* TWO OPTION DYNAMIC SIDE-BY-SIDE ARCHITECTURAL VIEWPORT */}
                    <div className="border border-stone-200 rounded-2xl p-5 bg-stone-50/50">
                      <div className="flex items-center justify-between border-b border-stone-200 pb-3 mb-4">
                        <div>
                          <span className="text-[10px] uppercase font-mono tracking-widest text-[#C47A5C] font-bold">01. Interactive 2D Map Optimizer</span>
                          <h5 className="text-sm font-semibold text-stone-800">Compare Dynamic Architectural Layout Strategies</h5>
                        </div>
                        <div className="flex bg-stone-200/60 p-1 rounded-lg border border-stone-300/30">
                          <button
                            type="button"
                            onClick={() => setSelectedLayoutOption("optionA")}
                            className={`text-xs px-2.5 py-1 rounded-md transition ${
                              selectedLayoutOption === "optionA" ? "bg-white font-semibold text-[#1C242B]" : "text-stone-500 hover:text-stone-800"
                            }`}
                          >
                            Option A
                          </button>
                          <button
                            type="button"
                            onClick={() => setSelectedLayoutOption("optionB")}
                            className={`text-xs px-2.5 py-1 rounded-md transition ${
                              selectedLayoutOption === "optionB" ? "bg-white font-semibold text-[#1C242B]" : "text-stone-500 hover:text-stone-800"
                            }`}
                          >
                            Option B
                          </button>
                        </div>
                      </div>

                      {/* Layout info display */}
                      <div className="mb-4">
                        <h6 className="text-sm font-serif font-bold text-[#1C242B]">
                          {proposalResult.layouts?.[selectedLayoutOption]?.title}
                        </h6>
                        <p className="text-xs text-stone-600 mt-1 leading-relaxed">
                          {proposalResult.layouts?.[selectedLayoutOption]?.description}
                        </p>
                      </div>

                      {/* Interactive Visual SVG Grid map box */}
                      <div className="relative bg-white aspect-square w-full max-w-md mx-auto border-2 border-stone-300 rounded-xl overflow-hidden shadow-xs flex items-center justify-center p-4">
                        
                        {/* Blueprint grid dots */}
                        <div className="absolute inset-0 bg-grid-pattern opacity-10 pointer-events-none" style={{ backgroundImage: "radial-gradient(#1c242b 1px, transparent 1px)", backgroundSize: "16px 16px" }} />

                        {/* Rooms container scaled */}
                        <svg viewBox="0 0 100 100" className="w-full h-full relative z-10 font-sans">
                          {/* Outer wall boundary outline */}
                          <rect x="2" y="2" width="96" height="96" fill="none" stroke="#1C242B" strokeWidth="1.5" strokeDasharray="3 3" />
                          <text x="6" y="93" className="text-[4px] fill-stone-400 uppercase font-mono tracking-widest font-semibold">Boundary Envelope</text>

                          {proposalResult.layouts?.[selectedLayoutOption]?.rooms?.map((room, idx) => {
                            const isHovered = hoveredRoom === room.name;
                            return (
                              <g 
                                key={idx}
                                onMouseEnter={() => setHoveredRoom(room.name)}
                                onMouseLeave={() => setHoveredRoom(null)}
                                className="cursor-help transition duration-150"
                              >
                                {/* Room shape fill-color maps dynamically */}
                                <rect
                                  x={room.x}
                                  y={room.y}
                                  width={room.w}
                                  height={room.h}
                                  rx="2"
                                  className={`stroke-stone-800 stroke-[0.8] transition-colors ${room.color} ${isHovered ? "fill-amber-200/90" : ""}`}
                                />
                                <text
                                  x={room.x + (room.w / 2)}
                                  y={room.y + (room.h / 2)}
                                  textAnchor="middle"
                                  dominantBaseline="middle"
                                  className={`fill-stone-800 font-medium font-sans pointer-events-none`}
                                  style={{ fontSize: room.w < 20 ? "2.5px" : "4.5px" }}
                                >
                                  {room.name}
                                </text>
                              </g>
                            );
                          })}
                        </svg>

                        {/* Real-time room detail hover guide overlay banner */}
                        <div className="absolute bottom-2 left-2 right-2 bg-[#1C242B]/90 backdrop-blur-xs text-white p-2.5 rounded-lg text-xs flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                            <span>
                              {hoveredRoom ? (
                                <>Hovered space: <strong className="text-[#C47A5C]">{hoveredRoom}</strong></>
                              ) : (
                                "Hover layout blocks to view spatial metrics"
                              )}
                            </span>
                          </div>
                          <span className="text-[9px] uppercase font-mono bg-stone-800 px-1.5 py-0.5 rounded tracking-wide text-stone-200">Scale Grid Verified</span>
                        </div>

                      </div>

                      {/* Pros & Cons List */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6 border-t border-stone-200 pt-4">
                        <div>
                          <span className="text-[10px] uppercase font-bold text-stone-400 tracking-wider">Option Advantages</span>
                          <ul className="text-xs list-disc pl-4 mt-2 text-stone-700 space-y-1">
                            {proposalResult.layouts?.[selectedLayoutOption]?.pros?.map((pro, index) => (
                              <li key={index}>{pro}</li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <span className="text-[10px] uppercase font-bold text-stone-400 tracking-wider">Atelier Trade-offs</span>
                          <ul className="text-xs list-disc pl-4 mt-2 text-stone-700 space-y-1">
                            {proposalResult.layouts?.[selectedLayoutOption]?.cons?.map((con, index) => (
                              <li key={index} className="text-stone-500">{con}</li>
                            ))}
                          </ul>
                        </div>
                      </div>

                    </div>

                    {/* BUDGET FEASIBILITY & BREAKDOWN GRAPHICS */}
                    <div className="border border-stone-200 rounded-2xl p-5 bg-stone-50/50">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-stone-200 pb-3 mb-4 gap-2">
                        <div>
                          <span className="text-[10px] uppercase font-mono tracking-widest text-[#C47A5C] font-bold">02. Investment Balance Matrix</span>
                          <h5 className="text-sm font-semibold text-stone-800">Dynamic Capital Allocations</h5>
                        </div>
                        <span className="bg-[#FAF9F6] border border-stone-300 text-stone-800 text-xs px-2.5 py-1 rounded-full font-bold flex items-center gap-1.5 shrink-0 shadow-xs">
                          <Layers className="w-3.5 h-3.5 text-[#C47A5C]" />
                          Status: {proposalResult.budgetFeasibility?.status || "Balanced"}
                        </span>
                      </div>

                      <p className="text-xs text-stone-600 mb-5 leading-relaxed bg-white border border-stone-200 rounded-xl p-3">
                        {proposalResult.budgetFeasibility?.assessment}
                      </p>

                      {/* Allocation Bar Charts */}
                      <span className="text-[10px] uppercase font-bold text-stone-400 tracking-wider block mb-3 leading-none">Financial Itemization & Projections:</span>
                      
                      <div className="space-y-3">
                        {proposalResult.budgetFeasibility?.breakdown?.map((item, index) => (
                          <div key={index} className="bg-white border border-stone-200 p-3 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
                            <div className="flex-1 min-w-0">
                              <div className="flex justify-between items-baseline mb-1">
                                <span className="text-xs font-semibold text-stone-800 truncate">{item.item}</span>
                                <span className="text-xs font-bold text-[#1C242B]" data-font="mono">
                                  S$ {item.cost.toLocaleString("en-SG")} SGD ({item.percentage}%)
                                </span>
                              </div>
                              <div className="w-full bg-stone-100 rounded-full h-1.5 overflow-hidden">
                                <div 
                                  className="h-1.5 rounded-full transition-all duration-300 ${index % 2 === 0 ? 'bg-[#C47A5C]' : 'bg-[#5B6D5E]'}"
                                  style={{ 
                                    width: `${item.percentage}%`,
                                    backgroundColor: index % 2 === 0 ? "#C47A5C" : "#5B6D5E"
                                  }}
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* FENG SHUI & ECO RECOMMENDATIONS */}
                    {proposalResult.recommendations?.map((rec, index) => (
                      <div key={index} className="border border-stone-200 rounded-2xl p-5 bg-stone-50/50">
                        <div className="flex items-center gap-2 border-b border-stone-200 pb-2 mb-3">
                          <Compass className="w-4 h-4 text-[#C47A5C]" />
                          <h5 className="text-xs uppercase font-mono tracking-widest text-[#C47A5C] font-bold">{rec.category} Advice</h5>
                        </div>
                        <ul className="space-y-2.5">
                          {rec.tips?.map((tip, idx) => (
                            <li key={idx} className="text-xs text-stone-700 leading-relaxed flex items-start gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#1C242B] shrink-0 mt-2" />
                              <span>{tip}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}

                    {/* CONTRACTOR MATCHMAKING OPT-IN & RESULTS AREA */}
                    <div className="border border-stone-200 rounded-2xl p-5 bg-[#FAF7F2] border-l-4 border-l-[#C47A5C] shadow-xs">
                      <div className="flex items-center justify-between border-b border-stone-200 pb-2 mb-3">
                        <div className="flex items-center gap-2">
                          <Hammer className="w-4 h-4 text-[#C47A5C]" />
                          <h5 className="text-xs uppercase font-mono tracking-widest text-[#C47A5C] font-bold">
                            CaseTrust™ Verified Builder Support
                          </h5>
                        </div>
                        <span className={`text-[9px] font-mono px-2 py-0.5 rounded font-semibold ${
                          (isContractorCheckedOut || inputs.wantContractorConnect)
                            ? "bg-[#5B6D5E] text-white animate-pulse"
                            : "bg-[#C47A5C]/10 text-[#C47A5C]"
                        }`}>
                          {(isContractorCheckedOut || inputs.wantContractorConnect) ? "Connection Active" : "Optional Matching Service"}
                        </span>
                      </div>

                      {/* If connection is active/paid, show the matched contractors list */}
                      {(isContractorCheckedOut || inputs.wantContractorConnect) ? (
                        <div className="space-y-4">
                          <p className="text-xs text-stone-700 leading-relaxed">
                            🎉 <strong>Premium HDB-licensed builder connection is now active!</strong> Based on your budget of <strong>S$ {inputs.budget?.toLocaleString("en-SG")} SGD</strong>, selected location (<strong>{inputs.location}</strong>), and layout concept style, our studio has initialized coordination files for the following CaseTrust builders:
                          </p>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div className="bg-white p-3 rounded-xl border border-stone-150 shadow-2xs">
                              <span className="text-[9px] font-mono uppercase bg-[#1C242B]/10 text-stone-700 px-1.5 py-0.5 rounded">ID Builder A</span>
                              <h6 className="text-xs font-bold text-stone-800 mt-1.5">Darwin Interior</h6>
                              <p className="text-[10px] text-[#5B6D5E] mt-0.5 font-medium">★ 4.8 Rating • 150+ HDB Reviews</p>
                              <p className="text-[10px] text-stone-500 mt-1 italic">"{inputs.location} Precinct Specialist & Certified HDB-Registered"</p>
                            </div>
                            <div className="bg-white p-3 rounded-xl border border-stone-150 shadow-2xs">
                              <span className="text-[9px] font-mono uppercase bg-[#1C242B]/10 text-stone-700 px-1.5 py-0.5 rounded">ID Builder B</span>
                              <h6 className="text-xs font-bold text-stone-800 mt-1.5">Ciseern Interior</h6>
                              <p className="text-[10px] text-[#5B6D5E] mt-0.5 font-medium">★ 4.9 Rating • CaseTrust Award</p>
                              <p className="text-[10px] text-stone-500 mt-1 italic font-light">"Highly rated bespoke carpentry & wood veneer specialists"</p>
                            </div>
                            <div className="bg-white p-3 rounded-xl border border-stone-150 shadow-2xs">
                              <span className="text-[9px] font-mono uppercase bg-[#1C242B]/10 text-stone-700 px-1.5 py-0.5 rounded">ID Builder C</span>
                              <h6 className="text-xs font-bold text-stone-800 mt-1.5">Ovon Design</h6>
                              <p className="text-[10px] text-[#5B6D5E] mt-0.5 font-medium">★ 4.7 Rating • Low-E/Eco Specialist</p>
                              <p className="text-[10px] text-stone-500 mt-1 italic">"Expert layout customizer with rapid 4-week fast-track builds"</p>
                            </div>
                          </div>

                          <div className="bg-[#5B6D5E]/10 border border-[#5B6D5E]/30 rounded-xl p-3 flex sm:items-center justify-between gap-3 flex-col sm:flex-row text-xs">
                            <div className="text-stone-700 leading-normal flex-1">
                              We are forwarding your custom <strong>Spatial Notes</strong> and interactive colors. Vetted representatives will email comparative quotations to <strong className="text-[#1C242B]">{userAccount?.email || "okcheng77@gmail.com"}</strong>.
                            </div>
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  alert("Success! Builder specifications have been refreshed. Your Case File has been re-synchronized.");
                                }}
                                className="text-[10px] font-mono font-bold uppercase bg-[#5B6D5E] hover:bg-[#1C242B] text-white px-3 py-2 rounded-lg shrink-0 text-center cursor-pointer transition-all duration-250 hover:shadow-xs"
                              >
                                Sync Case File
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setInputs(prev => ({ ...prev, wantContractorConnect: false }));
                                  setIsContractorCheckedOut(false);
                                }}
                                className="text-[10px] font-mono uppercase text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 px-2 py-2 rounded-lg transition"
                                title="Cancel Matchmaking Support"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <p className="text-xs text-stone-600 leading-relaxed font-light">
                            Skip the renovation horror stories, phantom quotes, and poor quality woodwork. We partner with fully licensed, CaseTrust-certified boutique Singapore builders to help transform your custom layout into reality without the drama.
                          </p>

                          <div className="bg-white border border-stone-150 p-3.5 rounded-xl shadow-2xs">
                            <span className="text-[10px] uppercase font-bold text-[#C47A5C] tracking-wide block mb-1">What's Included for a Nominal S$ 15 Fee:</span>
                            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-stone-600 font-sans">
                              <li className="flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                                3 Vetted, HDB-registered builders matched to budget
                              </li>
                              <li className="flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                                Detailed itemized materials quote comparisons
                              </li>
                              <li className="flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                                Priority HDB-permit fast-track paperwork processing
                              </li>
                              <li className="flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                                100% CaseTrust financial insurance protection
                              </li>
                            </ul>
                          </div>

                          <div className="flex flex-col sm:flex-row items-center justify-between bg-[#F5EFE6]/30 border border-[#D5C29D]/30 p-3 rounded-xl gap-3">
                            <div className="text-[11px] text-stone-600 leading-tight flex-1">
                              Would you like to get connected to reliable contractors for a nominal fee?
                              <span className="block text-stone-800 font-bold mt-1 text-xs">One-time matching compilation fee: S$ 15 SGD</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setInputs(prev => ({ ...prev, wantContractorConnect: true }));
                                setContractorModalOpen(true);
                              }}
                              className="w-full sm:w-auto text-[10px] font-mono font-bold uppercase bg-[#C47A5C] hover:bg-[#1C242B] text-white px-4 py-2.5 rounded-lg transition duration-200 shrink-0 cursor-pointer text-center"
                            >
                              Connect Me for S$ 15
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* ITERATIVE DESIGN REFINEMENT CARD PANEL */}
                    <div className="border border-stone-200 rounded-2xl p-5 bg-[#FAF9F6] mt-4 shadow-sm">
                      <div className="flex items-center justify-between border-b border-stone-200 pb-2 mb-3">
                        <div className="flex items-center gap-2">
                          <History className="w-4 h-4 text-[#C47A5C]" />
                          <h5 className="text-xs uppercase font-mono tracking-widest text-[#C47A5C] font-bold">
                            Design Refinement Loop
                          </h5>
                        </div>
                        <span className="text-[10px] font-mono bg-[#1C242B] text-white px-2 py-0.5 rounded font-semibold">
                          {iterationCount >= 3 ? "Final Concept Locked" : `Stage: ${iterationCount}/3`}
                        </span>
                      </div>

                      <p className="text-xs text-stone-600 mb-3.5 leading-relaxed font-light">
                        After inspecting this draft design layout, you can submit specific revision comments to refine the spatial option arrangements. 
                        You have up to <strong className="text-stone-800">3 refinement iterations</strong> before your final proposal is rendered.
                      </p>

                      {feedbackHistory.length > 0 && (
                        <div className="mb-4 space-y-1.5 max-h-[140px] overflow-y-auto pr-1">
                          <span className="text-[9px] uppercase tracking-wider text-[#C47A5C] font-bold block font-mono">Iteration History Journal:</span>
                          {feedbackHistory.map((note, index) => (
                            <div key={index} className="text-[11px] leading-relaxed bg-white border border-stone-150 p-2.5 rounded-xl text-stone-700 flex items-start gap-2">
                              <span className="text-[#C47A5C] font-mono font-bold shrink-0">Step {index + 1}:</span>
                              <span className="italic">"{note}"</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {iterationCount < 3 ? (
                        <div className="space-y-3">
                          <textarea
                            rows={2}
                            value={refinementFeedback}
                            onChange={(e) => setRefinementFeedback(e.target.value)}
                            disabled={isRefining}
                            placeholder="e.g. 'Push the kitchen counter towards the left balcony to create an open pantry', 'Switch to a softer warm timber color scheme', 'Move the living room divider closer to the foyer'..."
                            className="w-full bg-white border border-stone-200 rounded-xl text-xs p-3 focus:outline-none focus:border-[#C47A5C] transition-all"
                          />
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={handleRefinedSubmission}
                              disabled={isRefining || !refinementFeedback.trim()}
                              className="text-[10px] font-mono uppercase bg-[#1C242B] hover:bg-[#C47A5C] text-white px-4 py-2.5 rounded-xl transition duration-200 font-bold disabled:opacity-40 flex items-center gap-1.5 cursor-pointer"
                            >
                              {isRefining ? (
                                <>Refining Layout... <span className="w-2.5 h-2.5 rounded-full border-2 border-white/30 border-t-white animate-spin" /></>
                              ) : (
                                <>Submit Step Revision <ArrowRight className="w-3.5 h-3.5" /></>
                              )}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-emerald-50/70 border border-emerald-200 p-4 rounded-xl text-xs text-emerald-800 leading-relaxed font-light">
                          <span className="font-bold text-stone-800 block mb-0.5">★ Final Atelier Masterpiece Generated</span>
                          You have completed the maximum 3 design adjustments. The ultimate balance of space, Feng Shui flow, and ecological efficiency is locked below.
                        </div>
                      )}
                    </div>

                    {/* Print / Reset workspace tools */}
                    <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-stone-100">
                      <button
                        onClick={() => window.print()}
                        className="flex-1 text-xs font-mono uppercase bg-[#1C242B] hover:bg-[#C47A5C] text-white py-2.5 rounded-xl transition font-bold"
                      >
                        Print Architect Outline
                      </button>
                      <button
                        onClick={handleResetForm}
                        className="flex-1 text-xs border border-stone-300 text-stone-500 hover:text-stone-800 hover:bg-stone-50 py-2.5 rounded-xl transition"
                      >
                        Start New Layout Analysis
                      </button>
                    </div>

                  </div>
                </div>
              )}

            </section>

          </div>
        </main>
      )}

      {/* Real-time Design Stream (History) */}
      {activeTab === "history" && (
        <section className="flex-1 w-full max-w-7xl mx-auto px-4 py-8 sm:py-12 md:px-6">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="text-[11px] uppercase tracking-[0.25em] font-mono text-[#C47A5C] font-bold block mb-1">
              • LIVE STUDIO STREAMS •
            </span>
            <h2 className="text-3xl font-serif text-[#1C242B] tracking-tight">
              Community Space Blueprints
            </h2>
            <p className="text-xs text-stone-500 mt-2 leading-relaxed font-light">
              A public stream of generated spatial layout concepts. Sponsored by our Singapore Atelier, synchronized across users in high-performance real-time using <strong className="text-stone-700">Supabase Postgres</strong>.
            </p>
          </div>

          {isLoadingEntries && entries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 bg-white border border-stone-200/60 rounded-3xl p-6 text-center">
              <RefreshCw className="w-8 h-8 text-[#C47A5C] animate-spin mb-3" />
              <p className="text-xs text-stone-500 font-medium font-mono">RETRIEVING POSTGRES SPATIAL SPECIFICATIONS...</p>
            </div>
          ) : entries.length === 0 ? (
            <div className="text-center py-16 bg-white border border-stone-200 rounded-3xl p-8 max-w-lg mx-auto shadow-sm">
              <Sparkles className="w-8 h-8 text-stone-300 mx-auto mb-3" />
              <p className="text-xs text-stone-700 font-semibold mb-1">No Active Blueprints Yet</p>
              <p className="text-[11px] text-stone-400 font-light leading-normal mb-4">
                Be the very first designer to generate a layout concept and publish it to the real-time Supabase network!
              </p>
              <button
                type="button"
                onClick={() => setActiveTab("planner")}
                className="px-4 py-2 bg-[#1C242B] text-white text-xs font-mono uppercase tracking-wider font-bold rounded-xl hover:bg-[#C47A5C] transition cursor-pointer"
              >
                Launch Planner
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {entries.map((entry, idx) => {
                const colors = entry.proposal?.palette?.colors || [];
                const summary = entry.proposal?.overallSummary || "Modern compact renovation";
                const themeName = entry.proposal?.themeName || "Unknown Style Theme";
                const dateText = entry.created_at ? new Date(entry.created_at).toLocaleTimeString("en-SG", {
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit"
                }) : "Just now";

                return (
                  <div 
                    key={entry.id || idx}
                    className="bg-white border border-stone-200 hover:border-[#C47A5C] rounded-2xl p-5 shadow-xs transition-all duration-300 hover:shadow-md flex flex-col justify-between relative group overflow-hidden"
                  >
                    {/* Visual bar matching first color of palette */}
                    <div 
                      className="absolute left-0 top-0 bottom-0 w-1.5 transition-colors duration-300"
                      style={{ backgroundColor: colors[0]?.hex || "#C47A5C" }}
                    />

                    <div>
                      {/* Avatar header */}
                      <div className="flex items-center justify-between border-b border-stone-100 pb-3 mb-3 pl-2">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-[#1C242B] text-white text-xs font-bold font-mono flex items-center justify-center shrink-0 shadow-2xs">
                            {(entry.user_name || "G")[0].toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <span className="text-xs font-semibold text-stone-800 block truncate leading-tight">
                              {entry.user_name || "Guest Designer"}
                            </span>
                            <span className="text-[9px] text-[#C47A5C] tracking-wide block truncate">
                              {entry.user_email || "guest@renovatesmarter.com"}
                            </span>
                          </div>
                        </div>
                        <span className="text-[9px] font-mono text-stone-400 bg-stone-50 border border-stone-150 px-2 py-0.5 rounded-md flex items-center gap-1 shrink-0">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                          {dateText}
                        </span>
                      </div>

                      <div className="pl-2 space-y-3">
                        {/* Blueprint Metadata Row */}
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-stone-600 font-sans">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-[#C47A5C]" />
                            <strong>{entry.inputs?.location || "Singapore"}</strong>
                          </span>
                          <span className="flex items-center gap-1">
                            <Home className="w-3 h-3 text-[#C47A5C]" />
                            {entry.inputs?.housingType || "HDB"}
                          </span>
                          <span className="flex items-center gap-1 text-[#5B6D5E] font-medium">
                            <DollarSign className="w-3 h-3 text-[#5B6D5E]" />
                            S$ {entry.inputs?.budget?.toLocaleString("en-SG") || "35,000"} SGD
                          </span>
                        </div>

                        {/* Proposal Theme Card */}
                        <div className="bg-[#FAF7F2] border border-stone-150 rounded-xl p-3.5 mt-2">
                          <span className="text-[9px] font-mono uppercase bg-stone-200/50 text-[#1C242B] px-1.5 py-0.5 rounded font-bold">
                            {themeName}
                          </span>
                          <p className="text-[11px] text-stone-700 italic mt-2 leading-relaxed font-serif">
                            &ldquo;{summary}&rdquo;
                          </p>

                          {/* Color strip */}
                          {colors.length > 0 && (
                            <div className="flex items-center gap-1.5 mt-3 pt-2.5 border-t border-stone-200/40">
                              <span className="text-[9px] font-mono font-bold text-[#C47A5C] mr-1 uppercase">Aesthetic:</span>
                              {colors.map((c: any, i: number) => (
                                <div 
                                  key={i} 
                                  className="w-4 h-4 rounded-full border border-stone-200 cursor-help transition hover:scale-110 shrink-0 shadow-2xs"
                                  style={{ backgroundColor: c.hex || "#FFF" }}
                                  title={`${c.name || "Color"} (${c.hex})`}
                                />
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Feedback count and iterative stage indicator */}
                        {entry.iteration_count > 0 && (
                          <div className="flex items-center gap-1.5 text-[10px] text-amber-800 bg-amber-50 border border-amber-100 px-2.5 py-1.5 rounded-lg font-mono">
                            <RefreshCw className="w-3 h-3 text-amber-700 animate-spin shrink-0" style={{ animationDuration: "12s" }} />
                            <span>Successfully refined over <strong>{entry.iteration_count}</strong> customized iteration cycles</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="pl-2 mt-5 pt-3 border-t border-stone-100 flex items-center justify-between gap-3">
                      <span className="text-[10px] text-stone-400 font-mono italic">
                        {entry.inputs?.scope === "whole" ? "Whole House Scope" : `Focus: ${entry.inputs?.roomsSelected?.slice(0, 2).join(", ")}`}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          if (entry.inputs) {
                            setInputs(entry.inputs);
                          }
                          if (entry.proposal) {
                            setProposalResult(entry.proposal);
                          }
                          setFeedbackHistory(entry.feedback_history || []);
                          setIterationCount(entry.iteration_count || 0);
                          setActiveTab("planner");
                          
                          // Scroll down to the proposal content container smoothly
                          setTimeout(() => {
                            document.getElementById("proposal-concept-box")?.scrollIntoView({ behavior: "smooth" });
                          }, 150);
                        }}
                        className="text-[10px] font-mono font-bold uppercase tracking-widest bg-[#1C242B] text-[#FAF9F6] px-3.5 py-2 rounded-xl border border-[#1C242B] hover:bg-[#C47A5C] hover:border-[#C47A5C] transition duration-300 cursor-pointer flex items-center gap-1.5 shadow-2xs group-hover:bg-[#C47A5C] group-hover:border-[#C47A5C]"
                      >
                        <Sparkles className="w-3.5 h-3.5 shrink-0" />
                        Load to Workbench
                      </button>
                    </div>

                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* Pricing Page screen views */}
      {activeTab === "pricing" && (
        <section className="flex-1 w-full max-w-7xl mx-auto px-4 py-12 md:px-6">
          <div className="text-center max-w-xl mx-auto mb-10">
            <span className="text-[11px] uppercase tracking-[0.25em] font-mono text-[#C47A5C] font-bold">04. Flexible Credit Levels</span>
            <h2 className="text-3xl font-serif text-[#1C242B] mt-1.5">No-Friction Renovation Budgets</h2>
            <p className="text-xs text-stone-500 mt-2 leading-relaxed">
              Unlock precise multi-recommendation plans for complex housing structures. Upgrade your account simulation seamlessly anytime.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {pricingPlans.map((plan) => {
              const owned = userAccount?.plan === plan.id;
              return (
                <div 
                  key={plan.id}
                  className={`bg-white border rounded-2xl p-6 sm:p-8 flex flex-col justify-between relative shadow-sm transition ${
                    plan.isPopular ? "border-2 border-[#1C242B] ring-4 ring-[#1C242B]/5" : "border-stone-200"
                  }`}
                >
                  {plan.isPopular && (
                    <span className="absolute -top-3.5 right-6 bg-[#C47A5C] text-white text-[9px] uppercase tracking-widest font-mono font-bold px-3 py-1 rounded-full shadow-xs">
                      Atelier Studio Pick
                    </span>
                  )}

                  <div>
                    <span className="text-[10px] uppercase font-mono tracking-widest text-stone-400 font-bold block">{plan.name}</span>
                    <div className="flex items-baseline gap-1.5 mt-2.5">
                      <span className="text-4xl font-serif font-black text-[#1C242B]">{plan.price}</span>
                      <span className="text-xs text-stone-400 font-light font-mono">/ {plan.period}</span>
                    </div>
                    <p className="text-xs text-stone-500 mt-3.5 leading-relaxed font-light">{plan.description}</p>
                    
                    <div className="h-px bg-stone-100 my-5" />

                    <ul className="space-y-3">
                      {plan.features.map((feature, i) => (
                        <li key={i} className="text-xs text-stone-700 flex items-start gap-2 leading-tight">
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="mt-8">
                    <button
                      type="button"
                      onClick={() => handleSelectPlan(plan)}
                      disabled={owned}
                      className={`w-full py-2.5 rounded-xl text-xs font-mono tracking-wider uppercase font-bold transition duration-200 cursor-pointer ${
                        owned 
                          ? "bg-stone-100 text-stone-400 border border-stone-200 cursor-default" 
                          : plan.isPopular
                            ? "bg-[#1C242B] hover:bg-[#C47A5C] text-white"
                            : "border border-[#1A1A1A] text-[#1A1A1A] hover:bg-[#1A1A1A] hover:text-white bg-transparent"
                      }`}
                    >
                      {owned ? "Active Simulation Plan" : plan.actionText}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-12 text-center bg-[#1C242B] text-white p-6 rounded-2xl max-w-2xl mx-auto border border-stone-800">
            <h5 className="text-sm uppercase font-mono tracking-widest text-[#C47A5C] font-bold">Why Registration Matters?</h5>
            <p className="text-xs text-stone-300 mt-2 leading-relaxed">
              To sustain zero system lag, the initial Free Plan limits requests to 1 concurrent custom blueprint. Creating an instant local account activates local storage cache preservation, so you never lose your interior files.
            </p>
          </div>
        </section>
      )}

      {/* SOCIAL DISCUSSION FORUM */}
      <section className="w-full max-w-7xl mx-auto px-4 py-8 sm:py-12 md:px-6" id="social-discussion-section">
        <div className="bg-[#FAF9F6] rounded-3xl p-6 sm:p-8 border border-stone-200/80 shadow-xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-stone-200/60 pb-5 mb-6">
            <div>
              <span className="text-[10px] uppercase tracking-[0.2em] font-mono text-[#C47A5C] font-bold block mb-1">
                05. Atelier Social Matrix
              </span>
              <h3 className="text-2xl font-serif text-[#1C242B] tracking-tight">
                Design Stream & Homeowner Forum
              </h3>
              <p className="text-xs text-stone-500 mt-1 leading-relaxed max-w-xl font-light">
                Discuss live blueprints, seek reviews on renovation color matches, and connect with other designers. Powered securely by Disqus.
              </p>
            </div>
            <div className="flex items-center gap-2 bg-white border border-stone-150 rounded-xl px-3 py-1.5 text-[10px] font-mono text-stone-600 shrink-0 self-start md:self-center">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              <span>Social Channel Active • 繁中/EN Support</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 sm:p-6 border border-stone-150 shadow-2xs">
            <DisqusWrapper proposalThemeName={proposalResult?.themeName} />
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-white border-t border-stone-200/60 py-8 px-4 mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div>
            <p className="text-xs text-[#1C242B] font-bold">STUDIO <span className="font-serif italic font-normal text-[#C47A5C]">ATELIER AI</span></p>
            <p className="text-[10px] text-stone-400 uppercase font-mono tracking-widest mt-0.5">Singapore Smart Space Planners • Est. 2024</p>
          </div>
          <div className="flex gap-4 text-xs font-medium text-stone-500">
            <span className="hover:text-stone-800 cursor-pointer" onClick={() => setActiveTab("planner")}>Planner Dashboard</span>
            <span className="hover:text-stone-800 cursor-pointer" onClick={() => setActiveTab("pricing")}>Pricing Rules</span>
            <span className="hover:text-stone-800 cursor-pointer" onClick={() => alert("Simulated sandbox. All file transformations execute server-side.")}>Privacy Policy</span>
          </div>
        </div>
      </footer>

      {/* MOCK REGISTRATION SIGN-UP MODAL */}
      {authModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1C242B]/80 backdrop-blur-xs animate-fadeIn" id="auth-overlay-modal">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full border border-stone-200 shadow-xl relative animate-slideUp">
            
            <button
              onClick={() => setAuthModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 text-stone-400 hover:text-stone-800 rounded-lg hover:bg-stone-100 transition"
              id="close-auth-modal"
            >
              <X className="w-4 h-4" />
            </button>

            <span className="text-[9px] uppercase tracking-widest font-mono text-[#C47A5C] font-bold block mb-1">Join Studio Atelier</span>
            <h4 className="text-2xl font-serif text-[#1C242B] mb-2" id="auth-title-element">
              {authType === "register" ? "Create Free Workspace Account" : "Access Studio Workspace"}
            </h4>
            <p className="text-xs text-stone-500 leading-relaxed mb-6 font-light">
              Store your custom interior designs and layouts permanently cached in your workspace browser.
            </p>

            <form onSubmit={handleAuthSubmit} className="space-y-4">
              
              {authType === "register" && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] uppercase font-bold tracking-wider text-stone-400" htmlFor="auth-name">Your Full Name</label>
                  <input
                    id="auth-name"
                    type="text"
                    required
                    placeholder="e.g. Kenneth Cheng"
                    value={authName}
                    onChange={(e) => setAuthName(e.target.value)}
                    className="w-full bg-stone-50 border-b border-stone-200 py-1.5 text-sm focus:outline-none focus:border-[#C47A5C] transition-all"
                  />
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase font-bold tracking-wider text-stone-400" htmlFor="auth-email">Email Address</label>
                <input
                  id="auth-email"
                  type="email"
                  required
                  placeholder="name@company.com"
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  className="w-full bg-stone-50 border-b border-stone-200 py-1.5 text-sm focus:outline-none focus:border-[#C47A5C] transition-all"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase font-bold tracking-wider text-stone-400" htmlFor="auth-password">Workspace Password</label>
                <input
                  id="auth-password"
                  type="password"
                  required
                  placeholder="••••••••"
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  className="w-full bg-stone-50 border-b border-stone-200 py-1.5 text-sm focus:outline-none focus:border-[#C47A5C] transition-all"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase font-bold tracking-wider text-stone-400">Selected Level</label>
                <select
                  value={authPlanSelection}
                  onChange={(e) => setAuthPlanSelection(e.target.value)}
                  className="w-full text-xs py-2 bg-stone-50 border-b border-stone-200 focus:outline-none"
                >
                  <option value="free">Starter Plan — 1 blueprint credit</option>
                  <option value="basic_10">Studio Plan ($10) — 3 blueprint credits</option>
                  <option value="pro_30">Architect Plan ($30) — 10 blueprint credits</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-[#1C242B] hover:bg-[#C47A5C] text-white text-xs font-mono tracking-widest uppercase font-bold rounded-xl transition duration-300 shadow-sm mt-4 cursor-pointer"
                id="auth-submit-btn"
              >
                {authType === "register" ? "Activate Immediate Account" : "Access Workspace"}
              </button>

            </form>

            <div className="text-center mt-5">
              <button
                onClick={() => setAuthType(prev => prev === "register" ? "login" : "register")}
                className="text-xs text-stone-500 hover:text-[#C47A5C] hover:underline"
              >
                {authType === "register" ? "Already have account? Sign in here" : "Need registration? Click here"}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* MOCK CREDIT CARD PAYMENT MODAL CHECKOUT */}
      {checkoutModalOpen && selectedPlanForCheckout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1C242B]/85 backdrop-blur-xs animate-fadeIn" id="checkout-overlay-modal">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full border border-stone-200 shadow-xl relative animate-slideUp">
            
            <button
              onClick={() => {
                setCheckoutModalOpen(false);
                setSelectedPlanForCheckout(null);
              }}
              className="absolute top-4 right-4 p-1.5 text-stone-400 hover:text-stone-800 rounded-lg hover:bg-stone-100 transition"
              id="close-checkout-modal"
            >
              <X className="w-4 h-4" />
            </button>

            <span className="text-[10px] uppercase tracking-widest font-mono text-[#C47A5C] font-bold block mb-1">SECURE RENOVATION CREDIT SYSTEM</span>
            <h4 className="text-xl font-serif text-[#1C242B]" id="checkout-title">
              Purchase {selectedPlanForCheckout.name} credits
            </h4>
            <p className="text-xs text-stone-500 mt-1 leading-relaxed">
              Verify simulation credit allocation of <strong className="text-slate-800">{selectedPlanForCheckout.recommendationLimit} proposals</strong> with your simulated account credentials below.
            </p>

            <div className="my-5 p-4 bg-stone-50 rounded-xl border border-stone-200/60 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-mono text-stone-400 block tracking-widest">Pricing Strategy Selection</span>
                <span className="text-sm font-semibold text-stone-800">{selectedPlanForCheckout.name} Tier Option</span>
              </div>
              <span className="text-xl font-serif font-bold text-[#1C242B]">{selectedPlanForCheckout.price} USD</span>
            </div>

            <form onSubmit={handleCheckoutSubmit} className="space-y-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase font-bold tracking-wider text-stone-400" htmlFor="checkout-name">Cardholder Name</label>
                <input
                  id="checkout-name"
                  type="text"
                  required
                  placeholder="e.g. Kenneth Cheng"
                  value={cardHolderName}
                  onChange={(e) => setCardHolderName(e.target.value)}
                  className="w-full bg-stone-50 border-b border-stone-200 py-1.5 text-sm focus:outline-none focus:border-[#C47A5C]"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase font-bold tracking-wider text-stone-400" htmlFor="checkout-card">Simulated Visa / MasterCard</label>
                <div className="relative">
                  <CreditCard className="w-4 h-4 text-stone-400 absolute left-0 top-2.5" />
                  <input
                    id="checkout-card"
                    type="text"
                    required
                    placeholder="4000 1234 5678 9010"
                    maxLength={19}
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    className="w-full pl-6 bg-stone-50 border-b border-stone-200 py-1.5 text-sm focus:outline-none focus:border-[#C47A5C]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] uppercase font-bold tracking-wider text-stone-400" htmlFor="checkout-expiry">Expiry Date</label>
                  <input
                    id="checkout-expiry"
                    type="text"
                    required
                    placeholder="MM/YY"
                    maxLength={5}
                    className="w-full bg-stone-50 border-b border-stone-200 py-1.5 text-sm focus:outline-none focus:border-[#C47A5C]"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] uppercase font-bold tracking-wider text-stone-400" htmlFor="checkout-cvc">CVC Code</label>
                  <input
                    id="checkout-cvc"
                    type="text"
                    required
                    placeholder="123"
                    maxLength={3}
                    className="w-full bg-stone-50 border-b border-stone-200 py-1.5 text-sm focus:outline-none focus:border-[#C47A5C]"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 bg-[#C47A5C] hover:bg-[#b0674a] text-white text-xs font-mono tracking-widest uppercase font-bold rounded-xl transition duration-300 mt-4 shadow-sm cursor-pointer"
                id="checkout-confirm-btn"
              >
                Simulate Successful Payment Allocation
              </button>
            </form>

            <p className="text-[10px] text-center text-stone-400 mt-4 leading-relaxed uppercase tracking-wider">
              Protected by simulated sandbox SSL certificate • 0$ actual charge
            </p>

          </div>
        </div>
      )}

      {/* MOCK CONTRACTOR SERVICE CHECKOUT MODAL */}
      {contractorModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1C242B]/85 backdrop-blur-xs animate-fadeIn" id="contractor-checkout-modal">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full border border-stone-200 shadow-xl relative animate-slideUp">
            
            <button
              onClick={() => {
                setContractorModalOpen(false);
              }}
              className="absolute top-4 right-4 p-1.5 text-stone-400 hover:text-stone-800 rounded-lg hover:bg-stone-100 transition"
              id="close-contractor-modal"
            >
              <X className="w-4 h-4" />
            </button>

            <span className="text-[10px] uppercase tracking-widest font-mono text-[#C47A5C] font-bold block mb-1">BOUTIQUE BUILDER MATCH SERVICE</span>
            <h4 className="text-xl font-serif text-[#1C242B]" id="contractor-checkout-title">
              Secure Premium Contractor Match
            </h4>
            <p className="text-xs text-stone-500 mt-1 leading-relaxed">
              Activate your layout-synced builder request. 3 HDB-registered builders in <strong className="text-stone-800">{inputs.location || "Singapore"}</strong> will evaluate your project details.
            </p>

            <div className="my-5 p-4 bg-stone-50 rounded-xl border border-stone-200/60 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-mono text-stone-400 block tracking-widest">CaseTrust™ Dispatch Fee</span>
                <span className="text-sm font-semibold text-stone-800">Builder Matching Package</span>
              </div>
              <span className="text-xl font-serif font-bold text-[#1C242B]">S$ 15.00 SGD</span>
            </div>

            <form 
              onSubmit={(e) => {
                e.preventDefault();
                setIsContractorCheckedOut(true);
                setInputs(prev => ({ ...prev, wantContractorConnect: true }));
                setContractorModalOpen(false);
                alert("Success! Your nominal matching fee simulation was completed. Vetted builder files have been compiled.");
              }} 
              className="space-y-4"
            >
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase font-bold tracking-wider text-stone-400" htmlFor="contractor-name">Lead Contact Name</label>
                <input
                  id="contractor-name"
                  type="text"
                  required
                  placeholder="e.g. Kenneth Cheng"
                  value={cardHolderName}
                  onChange={(e) => setCardHolderName(e.target.value)}
                  className="w-full bg-stone-50 border-b border-stone-200 py-1.5 text-sm focus:outline-none focus:border-[#C47A5C]"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase font-bold tracking-wider text-stone-400" htmlFor="contractor-card">Simulated Card Details</label>
                <div className="relative">
                  <CreditCard className="w-4 h-4 text-stone-400 absolute left-0 top-2.5" />
                  <input
                    id="contractor-card"
                    type="text"
                    required
                    placeholder="4000 1234 5678 9010"
                    maxLength={19}
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    className="w-full pl-6 bg-stone-50 border-b border-stone-200 py-1.5 text-sm focus:outline-none focus:border-[#C47A5C]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] uppercase font-bold tracking-wider text-stone-400" htmlFor="contractor-expiry">Expiry Date</label>
                  <input
                    id="contractor-expiry"
                    type="text"
                    required
                    placeholder="MM/YY"
                    maxLength={5}
                    className="w-full bg-stone-50 border-b border-stone-200 py-1.5 text-sm focus:outline-none focus:border-[#C47A5C]"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] uppercase font-bold tracking-wider text-stone-400" htmlFor="contractor-cvc">CVC Code</label>
                  <input
                    id="contractor-cvc"
                    type="text"
                    required
                    placeholder="123"
                    maxLength={3}
                    className="w-full bg-stone-50 border-b border-stone-200 py-1.5 text-sm focus:outline-none focus:border-[#C47A5C]"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 bg-[#C47A5C] hover:bg-[#b0674a] text-white text-xs font-mono tracking-widest uppercase font-bold rounded-xl transition duration-300 mt-4 shadow-sm cursor-pointer"
                id="contractor-confirm-btn"
              >
                Assemble & Pay S$ 15 SGD
              </button>
            </form>

            <p className="text-[10px] text-center text-stone-400 mt-4 leading-relaxed uppercase tracking-wider">
              Secure Simulated Checkout • 0$ actual bank transaction
            </p>

          </div>
        </div>
      )}

    </div>
  );
}
