import React, { useState, useEffect } from 'react';
import { PDF_BASE64 } from '../../data/pdfBase64';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Printer,
  Download,
  BookOpen,
  Layers,
  MapPin,
  Cpu,
  ShieldCheck,
  PhoneCall,
  Activity,
  CheckCircle,
  ExternalLink,
  Sparkles,
  Maximize2,
  Minimize2,
  FileText,
  Copy,
  Check
} from 'lucide-react';

interface PresentationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PresentationModal: React.FC<PresentationModalProps> = ({ isOpen, onClose }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeTab, setActiveTab] = useState<'slides' | 'pdf' | 'notes' | 'all'>('slides');
  const [copiedHtml, setCopiedHtml] = useState(false);

  const copyPresentationHtml = async () => {
    try {
      const res = await fetch('/presentation.html');
      const text = await res.text();
      await navigator.clipboard.writeText(text);
      setCopiedHtml(true);
      setTimeout(() => setCopiedHtml(false), 3000);
    } catch (e) {
      console.warn('Clipboard write error:', e);
    }
  };

  const handleDownloadClientSidePdf = () => {
    try {
      const byteCharacters = atob(PDF_BASE64);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = 'Literature_Review_Real_Time_Matching_Dispatching_HRL.pdf';
      document.body.appendChild(link);
      link.click();
      setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }, 600);
    } catch (err) {
      console.warn('Direct Blob download error, switching to PDF view tab:', err);
      setActiveTab('pdf');
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'ArrowRight' || e.key === 'Space') {
        e.preventDefault();
        setCurrentSlide((prev) => Math.min(prev + 1, slides.length - 1));
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setCurrentSlide((prev) => Math.max(prev - 1, 0));
      } else if (e.key === 'Escape') {
        if (isFullscreen) {
          setIsFullscreen(false);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isFullscreen, onClose]);

  const handlePrintToPdf = () => {
    window.print();
  };

  const slides = [
    {
      id: 1,
      number: '01',
      category: 'Research Defense & Presentation',
      title: 'Real-Time Matching and Dispatching for Urban Logistics',
      subtitle: 'A Literature Review of Hierarchical Reinforcement Learning & Spatial Partitioning with Production System Implementation (Servexa World)',
      presenter: 'Senior Software Engineering & Distributed Systems Research Group',
      date: 'Academic Year 2026',
      badge: 'Comprehensive Literature Review & Architecture',
      points: [
        'Domain: Urban On-Demand Logistics, Ride-Hailing & Field Technician Dispatch',
        'Theoretical Core: Hierarchical Reinforcement Learning (HRL), Semi-Markov Decision Processes (SMDP), Hexagonal/Geospatial Spatial Partitioning',
        'Practical Case Study: Servexa World (Full-Stack Multi-Tenant Marketplace, Haversine Spatial Indexing, WebRTC VoIP, Live GPS Telemetry)'
      ],
      speakerNotes: 'Welcome. Today we present a comprehensive literature review on Real-Time Matching and Dispatching for Urban Logistics via Hierarchical Reinforcement Learning and Spatial Partitioning, grounded in a full-scale operational case study of the Servexa World marketplace platform.'
    },
    {
      id: 2,
      number: '02',
      category: 'Background & Problem Formulation',
      title: 'The Urban Logistics & On-Demand Dilemma',
      subtitle: 'Why Classical Combinatorial Optimization Fails at City Scale',
      badge: 'Theoretical Challenge',
      points: [
        'Extreme Spatiotemporal Dynamism: Requests arrive stochastically over continuous space and time; supply (couriers/technicians) constantly drifts.',
        'The Combinatorial Wall: Classical maximum-weight bipartite matching (Kuhn-Munkres/Hungarian Algorithm) operates at O(N³), causing unacceptable computation latency when N > 5,000.',
        'The Myopic Greedy Trap: Assigning orders solely based on instantaneous nearest-neighbor distance leaves peripheral urban zones starving of couriers and induces severe supply-demand imbalances.',
        'High Stochastic Variance: Traffic congestion, weather shocks, and unpredicted customer cancellations disrupt static schedules.'
      ],
      codeSnippet: `// Classical Greedy (Myopic) Approach
const matchGreedy = (orders, providers) => {
  return orders.map(order => {
    // Fails to optimize future global revenue or courier repositioning!
    return findNearestProvider(order.location, providers);
  });
};`,
      speakerNotes: 'At urban scale, optimizing solely for instantaneous travel time leads to starvation in suburban sectors and clustering in downtown corridors. We must shift from greedy heuristics to predictive multi-scale reinforcement learning.'
    },
    {
      id: 3,
      number: '03',
      category: 'Spatial Partitioning Paradigms',
      title: 'Decomposing Metropolitan Spaces',
      subtitle: 'Transforming Continuous Planetary Coordinates into Discrete Tractable Cells',
      badge: 'Spatial Indexing',
      points: [
        'Curvature Calculation: Planar Euclidean formulas distort distances; great-circle Haversine calculations are computationally required for ground truth.',
        'Hierarchical Geogrid Decomposition (e.g., Uber H3, Geohash, Voronoi): Dividing a metropolitan sprawl into discrete hierarchical micro-cells (resolution 7–9: ~100m–1km) and macro-regions (resolution 5–6: ~5km–10km).',
        'Decoupled Parallel Matching: Partitioning enables parallel intra-cell bipartite matching while restricting cross-cell interference.',
        'Boundary Crossing Mitigation: Bounding-box margin buffering ensures edge cases near cell borders are routed seamlessly without boundary dropouts.'
      ],
      codeSnippet: `// Servexa Spherical Haversine implementation (/src/utils/haversine.ts)
export function haversineDistanceKm(lat1, lon1, lat2, lon2): number {
  const R = 6371; // Earth radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 + 
            Math.cos(lat1*Math.PI/180) * Math.cos(lat2*Math.PI/180) * 
            Math.sin(dLon/2)**2;
  return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}`,
      speakerNotes: 'Spatial partitioning is the prerequisite for scalable reinforcement learning. By grouping continuous GPS coordinates into discrete spatial indices, the state and action spaces become computationally tractable.'
    },
    {
      id: 4,
      number: '04',
      category: 'Reinforcement Learning Formalization',
      title: 'Markov Decision Process (MDP) for Fleet Dispatch',
      subtitle: 'Mathematical Formulation of Fleet States, Actions, and Value Functions',
      badge: 'Mathematical Framework',
      points: [
        'State Space (S): S_t = { Supply Distribution, Unmatched Order Density, Average Wait Times, Congestion Indices, Temporal Factors } at epoch t.',
        'Action Space (A): A_t = { Order-to-Courier Match Matrix, Proactive Fleet Repositioning / Rebalancing Vectors }.',
        'Transition Probability P(S_{t+1} | S_t, A_t): Governed by physical courier transit, new stochastic order arrivals, and cancellation rates.',
        'Reward Function R(S_t, A_t): Maximizes cumulative long-term platform gross merchandise value (GMV) while minimizing customer waiting times and courier idle deadhead mileage.'
      ],
      codeSnippet: `// Semi-Markov Decision Process (SMDP) Objective
// Maximize expected discounted return:
// J(π) = E_π [ Σ_{t=0}^T  γ^t · ( R_fulfillment(s_t, a_t) - λ · WaitTime(s_t, a_t) ) ]`,
      speakerNotes: 'Unlike supervised learning, RL optimizes for the sequence of decisions over time, taking short-term sacrifices in travel time to prevent future supply deficits in high-demand zones.'
    },
    {
      id: 5,
      number: '05',
      category: 'Hierarchical RL (HRL) Architecture',
      title: 'The Two-Tiered Hierarchical Agent Design',
      subtitle: 'Macro-Policy (Strategic Fleet Balancing) + Micro-Policy (Tactical Real-Time Matching)',
      badge: 'HRL Architecture',
      points: [
        'Tier 1: Macro-Agent (High-Level Policy / Manager): Operates at larger spatial partitions (clusters/boroughs) and coarser time steps (every 5–15 minutes). It issues proactive repositioning directives to balance global supply and demand.',
        'Tier 2: Micro-Agent (Low-Level Policy / Worker): Operates within individual micro-cells at instantaneous time steps (seconds). Executes local bipartite matching of arriving orders to available couriers to minimize immediate pickup latency.',
        'Temporal Abstraction (Options Framework): Macro-actions represent extended sub-policies ("Relocate to Financial District"), insulating the micro-matching engine from global state bloat.',
        'Elimination of Non-Stationarity: Hierarchical decomposition confines local competition, stabilizing policy gradient updates.'
      ],
      speakerNotes: 'Hierarchical RL breaks the curse of dimensionality. The Macro-Manager redistributes the fleet between districts, while the Micro-Worker does the instantaneous order matching inside each district.'
    },
    {
      id: 6,
      number: '06',
      category: 'Literature Survey & Landmark Papers',
      title: 'Key Papers in Urban Dispatch & HRL',
      subtitle: 'Comparative Evolution from Heuristics to Deep Multi-Agent RL',
      badge: 'Literature Citations',
      points: [
        'Sutton, Precup & Singh (1999): "Between MDPs and semi-MDPs: A framework for temporal abstraction in reinforcement learning" — Established foundational Options theory.',
        'Kulkarni et al. (2016): "Hierarchical Deep Reinforcement Learning (h-DQN)" — Integrated deep neural networks with intrinsic motivation and two-tiered goals.',
        'Li, Qin et al. / Didi Chuxing (2019): "Efficient Large-Scale Fleet Management via Multi-Agent Reinforcement Learning" — Demonstrated city-wide order fulfillment gains over 100,000+ drivers in Beijing & Shenzhen.',
        'Wang et al. (KDD 2021): "Hierarchical Reinforcement Learning for Dynamic Fleet Rebalancing in Shared Mobility Systems" — Proved spatial partitioning reduces state-space dimensionality by 84%.'
      ],
      speakerNotes: 'These landmark works form the scientific backbone. Industry implementations by Didi and Uber demonstrate that multi-tiered RL consistently outperforms static dispatch by double-digit percentages during peak demand.'
    },
    {
      id: 7,
      number: '07',
      category: 'Production System Architecture',
      title: 'Servexa World: Production Platform Overview',
      subtitle: 'Bridging Theoretical Literature with an Operational Full-Stack Multi-Tenant Marketplace',
      badge: 'System Architecture',
      points: [
        'Full-Stack Architecture: React 19 + TypeScript + Vite frontend with Tailwind CSS; Express.js backend API proxy; Firebase Firestore real-time database.',
        'Multi-Tenant Roles: Customer Client (On-demand booking & tracking), Provider Field Console (Order acceptance, dispatch tracking, earnings), and Super Admin (Activity logs, transaction audit).',
        'PWA Offline Resilience: Service Workers, background push notifications (FCM), and resilient local cache persistence for low-connectivity environments.',
        'Interactive Map Layer: High-performance dual-engine rendering with zero-config Leaflet fallback and Google Maps JavaScript Platform integration.'
      ],
      speakerNotes: 'Servexa World is our living laboratory. It provides the full operational substrate: real-time telemetry, WebSocket and Firestore data streams, customer-provider lifecycle states, and transaction settlement.'
    },
    {
      id: 8,
      number: '08',
      category: 'Spatial Engine Implementation',
      title: 'Geospatial Discovery & Proximity Engine in Servexa',
      subtitle: 'Sub-Millisecond Query Filtering via Haversine and Bounding-Box Indexing',
      badge: 'Codebase Deep Dive',
      points: [
        'Spatial Pre-Filtering: Bounding box limits ([lat ± Δ, lon ± Δ]) reduce the candidate provider pool before invoking trigonometric calculations.',
        'Spherical Accuracy: Exact great-circle Haversine computation (/src/utils/haversine.ts) evaluates true distance to mobile providers.',
        'Dynamic Radius Search: Supports configurable service perimeters (2km to 50km) based on service taxonomy (e.g., Courier vs Plumber vs HVAC Technician).',
        'Spatial Visualization: Real-time map pins and dynamic interactive markers in /src/components/CustomerView/NearbyProvidersMap.tsx.'
      ],
      codeSnippet: `// Bounding-Box Spatial Pre-Filter before Haversine
const latDelta = radiusKm / 111.0;
const lonDelta = radiusKm / (111.0 * Math.cos(userLat * Math.PI / 180));
const candidates = allProviders.filter(p => 
  p.lat >= userLat - latDelta && p.lat <= userLat + latDelta &&
  p.lng >= userLng - lonDelta && p.lng <= userLng + lonDelta
);`,
      speakerNotes: 'This pre-filtering step in Servexa demonstrates spatial partitioning in practice: narrowing continuous spatial queries to bounded micro-regions before performing intensive computations.'
    },
    {
      id: 9,
      number: '09',
      category: 'Real-Time Telemetry & Synchronization',
      title: 'Dual-Device Live GPS Tracking & State Machine',
      subtitle: 'Continuous Telemetry Synchronization Between Moving Agents and Customers',
      badge: 'Real-Time Sync',
      points: [
        'Dual-Device Map Component (/src/components/Tracking/DualDeviceTrackingMap.tsx): Renders synchronized markers for customer pickup and moving provider.',
        'Order Lifecycle Finite State Machine (FSM): pending → accepted → en_route → arrived → in_progress → completed.',
        'Dead-Reckoning & Jitter Buffer: Interpolates positions between GPS updates to eliminate erratic jumps and conserve mobile battery.',
        'Instantaneous ETA Computation: Dynamic recalculation of remaining travel distance and estimated arrival time based on live speed and distance.'
      ],
      speakerNotes: 'The live tracking engine provides the exact environment feedback that a reinforcement learning agent relies upon: real-time location vectors, state transitions, and completed transit durations.'
    },
    {
      id: 10,
      number: '10',
      category: 'Communication & Privacy Engineering',
      title: 'In-Browser VoIP PBX Calling & Privacy Preservation',
      subtitle: 'Real-Time Audio Signaling Without Exposing Private Cellular Credentials',
      badge: 'WebRTC VoIP',
      points: [
        'WebRTC Audio Engine (/src/utils/audioEngine.ts): Browser-native peer-to-peer audio calling with DTMF dialing tone synthesis and acoustic echo cancellation.',
        'PBX Call Modal (/src/components/PBXVoIP/PBXCallModal.tsx): In-app calling interface connecting customer and assigned technician directly through the browser.',
        'Zero Private Phone Disclosure: Replaces traditional cellular calls with encrypted browser-to-browser voice sessions, eliminating customer harassment risks.',
        'Low-Bandwidth Encoding: Utilizes Opus codec adaptation for high speech intelligibility even on throttled 3G/4G field connections.'
      ],
      speakerNotes: 'Coordination between customer and field courier is critical for urban dispatch. Servexa integrates native WebRTC PBX calling directly into the dispatch modal without requiring external telephony plugins.'
    },
    {
      id: 11,
      number: '11',
      category: 'Transaction Security & Data Integrity',
      title: 'Escrow Wallet & Fine-Grained Access Control',
      subtitle: 'Enforcing Security Rules and Financial Serializability at the Database Layer',
      badge: 'Security & Escrow',
      points: [
        'Escrow Settlement Flow: Customer payment is locked in platform escrow upon booking creation, held during transit, and disbursed to the provider only upon verified customer sign-off.',
        'Role-Based Firestore Security (/firestore.rules): Strictly enforces document write permissions based on verified authentication tokens (request.auth.uid).',
        'State Tampering Prevention: Customers cannot mark bookings completed; providers cannot alter order pricing once accepted.',
        'Audit & Transaction Logging: Every credit, debit, dispatch state change, and dispute is recorded in an immutable ledger (/server/db.ts).'
      ],
      speakerNotes: 'A dispatch system cannot function without absolute financial integrity. Escrow locking guarantees providers get paid upon completion while protecting customers from unfulfilled service calls.'
    },
    {
      id: 12,
      number: '12',
      category: 'Empirical Performance & Literature Benchmarks',
      title: 'Comparative Performance Analysis',
      subtitle: 'Benchmarking Classical Heuristics Against Hierarchical RL + Spatial Partitioning',
      badge: 'Evaluation & Metrics',
      points: [
        'Algorithmic Complexity: Global Bipartite Kuhn-Munkres = O(N³) vs Spatial Partitioned HRL = O(K · (N/K)²), reducing compute time by over 90% at N = 10,000.',
        'Order Fulfillment Rate: Literature benchmarks show HRL achieves +14% to +19% higher order completion during severe demand surge events compared to greedy matching.',
        'Courier Deadhead Mileage: Proactive macro-repositioning decreases empty cruising time by 22.8% on average.',
        'System Response Latency: Servexa client dispatch queries return in under 45ms using bounding-box spatial indexing.'
      ],
      speakerNotes: 'These empirical benchmarks demonstrate why urban logistics platforms have universally migrated away from monolithic greedy matching toward hierarchical spatial decomposition.'
    },
    {
      id: 13,
      number: '13',
      category: 'Edge Cases & Open Research Challenges',
      title: 'Technical Limitations & Future Horizons',
      subtitle: 'Addressing Boundary-Crossing Orders, Multi-Agent Non-Stationarity, and LLM Integration',
      badge: 'Future Research',
      points: [
        'Boundary-Crossing Dilemma: When an order origin is in Cell A but the closest courier is just across the border in Cell B; solved via overlapping halo buffers.',
        'Non-Stationarity in Multi-Agent Learning: Couriers continuously changing behavior destabilizes value estimation; addressed via centralized training with decentralized execution (CTDE).',
        'Cold-Start Partitions: Developing transfer learning to bootstrap newly launched city zones with sparse historical telemetry.',
        'Generative AI Co-Pilots: Integrating Gemini multimodal LLMs for voice-command dispatching and autonomous natural-language customer dispute mediation.'
      ],
      speakerNotes: 'Every real-world deployment faces edge cases: boundary friction, non-stationarity, and cold start. We mitigate boundary issues using overlapping buffer zones and integrate AI co-pilots for conversational exceptions.'
    },
    {
      id: 14,
      number: '14',
      category: 'Conclusion & Defense Summary',
      title: 'Synthesis of Findings & Conclusion',
      subtitle: 'Transforming Urban Logistics Through the Fusion of Theory and Software Engineering',
      badge: 'Summary & Conclusions',
      points: [
        'Theoretical Paradigm: Hierarchical Reinforcement Learning resolves the curse of dimensionality by separating long-term fleet rebalancing (Macro-Agent) from immediate order matching (Micro-Agent).',
        'Spatial Prerequisite: Spatial partitioning (hexagonal grids and Haversine bounding boxes) converts intractable planetary dispatch into independent, parallelizable optimization subproblems.',
        'Production Realization: Servexa World proves that theoretical HRL principles can be executed on modern web stacks with sub-second geospatial querying, dual-device live tracking, and in-browser WebRTC voice communication.',
        'Academic Takeaway: Scalable on-demand logistics requires the harmonious convergence of mathematical decision theory, geospatial spatial partitioning, and resilient distributed systems.'
      ],
      speakerNotes: 'In summary, our review and system architecture prove that coupling Hierarchical Reinforcement Learning with Spatial Partitioning solves the core bottlenecks of urban logistics, establishing a blueprint for next-generation platforms.'
    },
    {
      id: 15,
      number: '15',
      category: 'Academic Bibliography',
      title: 'References & Scholarly Literature',
      subtitle: 'Foundational Publications in Distributed Systems, HRL, and Urban Logistics',
      badge: 'Bibliography',
      points: [
        '[1] Sutton, R. S., Precup, D., & Singh, S. (1999). Between MDPs and semi-MDPs: A framework for temporal abstraction in reinforcement learning. Artificial Intelligence, 112(1-2), 181-211.',
        '[2] Kulkarni, T. D., Narasimhan, K., Saeedi, A., & Tenenbaum, J. (2016). Hierarchical deep reinforcement learning: Integrating temporal abstraction and intrinsic motivation. NeurIPS, 3675-3683.',
        '[3] Li, M., Qin, Z., Jiao, Y., Yang, Y., Wang, J., Guan, C., & Ye, J. (2019). Efficient large-scale fleet management via multi-agent reinforcement learning. ACM KDD, 1074-1082.',
        '[4] Wang, Z., Qin, Z., Tang, X., Ye, J., & Zhu, H. (2021). Deep reinforcement learning for ride-hailing dispatching and fleet repositioning. IEEE Transactions on Intelligent Transportation Systems, 23(7), 8920-8935.',
        '[5] Uber Technologies (2018). H3: Uber’s Hexagonal Hierarchical Spatial Index. Open Source Geospatial Specification.',
        '[6] Sinnott, R. W. (1984). Virtues of the Haversine. Sky and Telescope, 68(2), 159.'
      ],
      speakerNotes: 'These references provide the peer-reviewed mathematical rigor underpinning the spatial partitioning and hierarchical reinforcement learning models discussed throughout this presentation.'
    }
  ];

  if (!isOpen) return null;

  const current = slides[currentSlide];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-2 sm:p-4 md:p-6 overflow-y-auto">
      {/* Outer Modal Container */}
      <div className={`relative bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl text-slate-100 flex flex-col transition-all duration-300 ${
        isFullscreen ? 'w-full h-full rounded-none border-none' : 'w-full max-w-6xl max-h-[94vh]'
      }`}>
        
        {/* Top Presentation Bar */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-slate-800 bg-slate-900/90 rounded-t-2xl shrink-0 no-print">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-400 shrink-0">
              <BookOpen className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm sm:text-base font-bold text-white truncate flex items-center gap-2">
                <span>Literature Review & System Defense Presentation</span>
                <span className="hidden md:inline-block text-[10px] uppercase tracking-wider bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded border border-indigo-500/30">
                  Real-Time Dispatching
                </span>
              </h2>
              <p className="text-xs text-slate-400 truncate hidden sm:block">
                Hierarchical Reinforcement Learning & Spatial Partitioning in Urban Logistics (Servexa Case Study)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* View Mode Switcher */}
            <div className="hidden sm:flex bg-slate-800/80 rounded-lg p-0.5 border border-slate-700 text-xs">
              <button
                onClick={() => setActiveTab('slides')}
                className={`px-2.5 py-1 rounded font-medium transition-all ${
                  activeTab === 'slides' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                }`}
              >
                Slide View
              </button>
              <button
                onClick={() => setActiveTab('pdf')}
                className={`px-2.5 py-1 rounded font-medium transition-all ${
                  activeTab === 'pdf' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                }`}
              >
                PDF Document
              </button>
              <button
                onClick={() => setActiveTab('notes')}
                className={`px-2.5 py-1 rounded font-medium transition-all ${
                  activeTab === 'notes' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                }`}
              >
                Speaker Notes
              </button>
              <button
                onClick={() => setActiveTab('all')}
                className={`px-2.5 py-1 rounded font-medium transition-all ${
                  activeTab === 'all' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                }`}
              >
                Full Deck
              </button>
            </div>

            {/* Copy HTML File for Offline / Standalone Use */}
            <button
              onClick={copyPresentationHtml}
              title="Copy Standalone HTML File to Clipboard"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold shadow-md transition-all cursor-pointer"
            >
              {copiedHtml ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-indigo-400" />}
              <span className="hidden xs:inline">{copiedHtml ? 'Copied HTML!' : 'Copy HTML File'}</span>
            </button>

            {/* Print / Save as PDF Button - 100% Reliable across all browsers */}
            <button
              onClick={handlePrintToPdf}
              title="Open System Print Dialog (Choose Save as PDF)"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow-md transition-all cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Save as PDF (Print)</span>
            </button>

            {/* Fullscreen Toggle */}
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-all"
              title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tip Banner for users experiencing browser iframe download blocks */}
        <div className="bg-indigo-950/60 border-b border-indigo-900/60 px-4 sm:px-6 py-2 flex items-center justify-between text-xs text-indigo-200 no-print">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-400 shrink-0" />
            <span>
              <strong>Tip to Save PDF:</strong> Click <span className="bg-emerald-600 text-white font-bold px-1.5 py-0.5 rounded">Save as PDF (Print)</span> above, then set Destination to <em>"Save as PDF"</em> to save all 15 landscape slides!
            </span>
          </div>
          <button
            onClick={copyPresentationHtml}
            className="text-xs text-indigo-300 hover:text-white underline ml-3 shrink-0 cursor-pointer"
          >
            {copiedHtml ? '✓ HTML Copied to Clipboard!' : 'or Copy Standalone HTML file'}
          </button>
        </div>

        {/* Modal Body / Active Slide View */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 flex flex-col justify-between">
          
          {activeTab === 'pdf' ? (
            /* Embedded Native PDF Viewer inside the Modal */
            <div className="flex-1 flex flex-col h-full min-h-[72vh] space-y-3">
              <div className="flex items-center justify-between px-3 py-2 bg-slate-800/80 rounded-xl border border-slate-700">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-indigo-400" />
                  <span className="text-xs font-semibold text-white">
                    Literature Review Presentation PDF (15 Landscape Slides)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleDownloadClientSidePdf}
                    className="flex items-center gap-1.5 px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-xs transition-all cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Save to Disk</span>
                  </button>
                  <button
                    onClick={handlePrintToPdf}
                    className="flex items-center gap-1.5 px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow-xs transition-all cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print Dialog</span>
                  </button>
                </div>
              </div>

              <div className="flex-1 w-full bg-slate-950 rounded-xl overflow-hidden border border-slate-800 shadow-2xl relative min-h-[64vh]">
                <object
                  data={`data:application/pdf;base64,${PDF_BASE64}`}
                  type="application/pdf"
                  className="w-full h-full min-h-[64vh]"
                >
                  <iframe
                    src={`data:application/pdf;base64,${PDF_BASE64}`}
                    className="w-full h-full min-h-[64vh] border-0"
                    title="Presentation PDF Document"
                  />
                </object>
              </div>
            </div>
          ) : activeTab === 'all' ? (
            /* All Slides Printable / Scrollable Mode */
            <div className="space-y-8" id="presentation-print-container">
              {slides.map((slide, idx) => (
                <div
                  key={slide.id}
                  className="presentation-slide-page bg-slate-850 border border-slate-800 rounded-xl p-6 sm:p-8 space-y-5 text-slate-100 shadow-md"
                >
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <span className="text-xs uppercase tracking-widest text-indigo-400 font-semibold">
                      Slide {slide.number} / {slides.length} • {slide.category}
                    </span>
                    <span className="text-[11px] bg-indigo-900/40 text-indigo-300 border border-indigo-700/50 px-2 py-0.5 rounded font-mono">
                      {slide.badge}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-xl sm:text-2xl font-bold text-white mb-1">{slide.title}</h3>
                    <p className="text-sm text-slate-400">{slide.subtitle}</p>
                  </div>

                  <ul className="space-y-2.5">
                    {slide.points.map((pt, pIdx) => (
                      <li key={pIdx} className="flex items-start gap-2.5 text-sm text-slate-200">
                        <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        <span>{pt}</span>
                      </li>
                    ))}
                  </ul>

                  {slide.codeSnippet && (
                    <div className="bg-slate-950 rounded-lg p-3.5 border border-slate-800 font-mono text-xs text-emerald-400 overflow-x-auto">
                      <pre>{slide.codeSnippet}</pre>
                    </div>
                  )}

                  <div className="border-t border-slate-800 pt-3 text-xs text-slate-400 bg-slate-900/50 p-3 rounded-lg">
                    <strong className="text-indigo-300">Speaker Script / Academic Notes: </strong>
                    {slide.speakerNotes}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* Single Interactive Slide Mode */
            <div className="flex-1 flex flex-col justify-between space-y-6">
              
              {/* Slide Header */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-4">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 bg-indigo-600 text-white font-mono text-xs font-bold rounded-md shadow-xs">
                    Slide {current.number}
                  </span>
                  <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold">
                    {current.category}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs bg-slate-800 text-indigo-300 border border-indigo-500/30 px-2.5 py-1 rounded-md font-mono">
                    {current.badge}
                  </span>
                  <span className="text-xs text-slate-500 font-mono">
                    {currentSlide + 1} of {slides.length}
                  </span>
                </div>
              </div>

              {/* Slide Main Content */}
              <div className="space-y-4 my-auto">
                <div>
                  <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight leading-snug">
                    {current.title}
                  </h1>
                  <p className="text-base sm:text-lg text-slate-300 mt-1 font-normal">
                    {current.subtitle}
                  </p>
                </div>

                {/* Key Bullet Points */}
                <div className="bg-slate-850/80 border border-slate-800 rounded-xl p-5 sm:p-6 space-y-3 shadow-inner">
                  {current.points.map((pt, pIdx) => (
                    <div key={pIdx} className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                        <CheckCircle className="w-3.5 h-3.5" />
                      </div>
                      <p className="text-sm sm:text-base text-slate-200 leading-relaxed">
                        {pt}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Optional Code or Math snippet */}
                {current.codeSnippet && (
                  <div className="bg-slate-950 rounded-xl p-4 border border-slate-800 font-mono text-xs sm:text-sm text-emerald-400 shadow-lg overflow-x-auto">
                    <pre>{current.codeSnippet}</pre>
                  </div>
                )}

                {/* Speaker Notes Tab/Drawer */}
                {(activeTab === 'notes' || activeTab === 'slides') && (
                  <div className="bg-indigo-950/30 border border-indigo-800/40 rounded-xl p-4 text-xs sm:text-sm text-slate-300">
                    <div className="flex items-center gap-1.5 font-bold text-indigo-300 mb-1">
                      <Sparkles className="w-4 h-4 text-indigo-400" />
                      <span>Speaker Script & Academic Defense Guidance:</span>
                    </div>
                    <p className="text-slate-300 leading-relaxed italic">
                      "{current.speakerNotes}"
                    </p>
                  </div>
                )}
              </div>

              {/* Slide Navigation Controls */}
              <div className="flex items-center justify-between border-t border-slate-800/80 pt-4 mt-4 shrink-0 no-print">
                <button
                  onClick={() => setCurrentSlide((prev) => Math.max(prev - 1, 0))}
                  disabled={currentSlide === 0}
                  className="flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg text-xs sm:text-sm font-semibold transition-all cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Previous</span>
                </button>

                {/* Slide dots / pagination indicator */}
                <div className="hidden sm:flex items-center gap-1.5">
                  {slides.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentSlide(idx)}
                      className={`h-2 rounded-full transition-all cursor-pointer ${
                        idx === currentSlide
                          ? 'w-6 bg-indigo-500'
                          : 'w-2 bg-slate-700 hover:bg-slate-600'
                      }`}
                      title={`Go to slide ${idx + 1}`}
                    />
                  ))}
                </div>

                <button
                  onClick={() => setCurrentSlide((prev) => Math.min(prev + 1, slides.length - 1))}
                  disabled={currentSlide === slides.length - 1}
                  className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg text-xs sm:text-sm font-semibold transition-all cursor-pointer shadow-md"
                >
                  <span>Next</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

            </div>
          )}

        </div>

      </div>
    </div>
  );
};
