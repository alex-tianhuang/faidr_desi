import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import SequenceArea from "./components/sequenceArea";
import ToolSelectionArea from "./components/toolSelectionArea";
import GenerateMimicArea from "./features/generateMimic";
import { FEATURE_CONFIGURATION, FEATURE_WEIGHTS } from "./lib/consts";

// const TABS = [
//   {
//     id: "analyze",
//     label: "Analyse",
//     icon: "◈",
//     color: "from-violet-500/20 to-indigo-500/20",
//     accent: "#8b5cf6",
//     content: {
//       title: "Analysis Results",
//       body: "Your input has been carefully examined across multiple dimensions. Patterns emerge from the structure of your text — recurring motifs, syntactic rhythms, and semantic density are all measured and weighed. The analysis considers both surface-level features and latent meaning encoded in word choice and sentence flow. Use these insights to refine your writing, deepen your arguments, or simply understand what you've created from a new perspective.",
//       stats: [
//         { label: "Clarity Score", value: "84%" },
//         { label: "Complexity", value: "Medium" },
//         { label: "Readability", value: "Grade 11" },
//         { label: "Sentiment", value: "Neutral" },
//       ],
//     },
//   },
//   {
//     id: "expand",
//     label: "Expand",
//     icon: "⊞",
//     color: "from-emerald-500/20 to-teal-500/20",
//     accent: "#10b981",
//     content: {
//       title: "Expanded Version",
//       body: "The ideas present in your text have been elaborated, enriched, and extended. Each key point is developed further, with supporting examples, alternative phrasings, and connective reasoning that ties the concepts together more cohesively. Expansions are generated to stay faithful to your original voice while broadening the scope of what's communicated. Consider this a first draft of something larger — a seed grown into a fuller shape.",
//       stats: [
//         { label: "Words Added", value: "+340" },
//         { label: "New Examples", value: "6" },
//         { label: "Structure", value: "Enhanced" },
//         { label: "Voice Match", value: "97%" },
//       ],
//     },
//   },
//   {
//     id: "distill",
//     label: "Distill",
//     icon: "◎",
//     color: "from-amber-500/20 to-orange-500/20",
//     accent: "#f59e0b",
//     content: {
//       title: "Distilled Essence",
//       body: "Everything non-essential has been stripped away. What remains is the concentrated core of your input — the nucleus of meaning extracted from the surrounding prose. This distillation preserves intent while discarding redundancy, qualifiers, and filler. Think of it as the version you'd share when you have thirty seconds, not thirty minutes. Sharp, precise, and unmistakably yours.",
//       stats: [
//         { label: "Compression", value: "78%" },
//         { label: "Key Ideas", value: "3" },
//         { label: "Lost Nuance", value: "Minimal" },
//         { label: "Impact", value: "High" },
//       ],
//     },
//   },
// ];

// const HINTS = [
//   {
//     id: "left",
//     label: "?",
//     tip: "How does this work?",
//     text: "Enter any text above and choose a mode below. Each mode processes your input differently — Analyse breaks it down, Expand grows it, and Distill compresses it. Your input is never stored or shared.",
//     position: "left-0 -translate-x-2",
//   },
//   {
//     id: "centre",
//     label: "?",
//     tip: "What's the best input?",
//     text: "This tool works best with prose, arguments, or reflective writing — at least 2–3 sentences. It handles everything from journal entries to technical summaries. Bullet points and lists are supported but may yield less nuanced results.",
//     position: "left-1/2 -translate-x-1/2",
//   },
//   {
//     id: "right",
//     label: "?",
//     tip: "Can I switch modes?",
//     text: "Absolutely. Switch between Analyse, Expand, and Distill at any time without re-entering your text. Each mode produces an independent result — you can compare outputs by toggling between them.",
//     position: "right-0 translate-x-2",
//   },
// ];

// export default function Page() {
//   const [activeTab, setActiveTab] = useState("analyze");
//   const [inputText, setInputText] = useState("");

//   const active = TABS.find((t) => t.id === activeTab);

//   return (
//     <div
//       className="min-h-screen bg-[#0c0c0f] text-white font-sans"
//       style={{ fontFamily: "'DM Sans', sans-serif" }}
//     >
//       {/* Background texture */}
//       <div
//         className="fixed inset-0 pointer-events-none opacity-30"
//         style={{
//           backgroundImage: `radial-gradient(ellipse 80% 60% at 50% -20%, rgba(139,92,246,0.15) 0%, transparent 70%)`,
//         }}
//       />

//       <div className="relative max-w-3xl mx-auto px-6 py-16 flex flex-col gap-10">

//         {/* ── HEADER ── */}
//         <header className="text-center space-y-4">
//           <div className="flex items-center justify-center gap-2 mb-2">
//             <Badge
//               variant="outline"
//               className="text-violet-400 border-violet-400/30 bg-violet-400/5 text-xs tracking-widest uppercase px-3"
//             >
//               Text Studio
//             </Badge>
//           </div>
//           <h1
//             className="text-5xl font-bold tracking-tight leading-none"
//             style={{ fontFamily: "'Playfair Display', serif", letterSpacing: "-0.02em" }}
//           >
//             Shape your words.
//           </h1>
//           <p className="text-[#8a8a99] text-base max-w-lg mx-auto leading-relaxed">
//             Paste or write anything below. Then choose how to transform it —
//             analyse its structure, expand its ideas, or distil it to its purest form.
//           </p>
//         </header>

//         <Separator className="bg-white/5" />

//         {/* ── TEXT INPUT ── */}
//         <div className="flex flex-col items-center gap-3">
//           <Textarea
//             placeholder="Start writing, or paste something you'd like to work with…"
//             value={inputText}
//             onChange={(e) => setInputText(e.target.value)}
//             className="w-full min-h-[180px] resize-y bg-white/[0.04] border border-white/10 text-white placeholder:text-white/25 rounded-xl text-base leading-relaxed focus:ring-1 focus:ring-violet-500/50 focus:border-violet-500/40 transition-all px-5 py-4"
//           />
//           <p className="text-xs text-white/20 self-end">
//             {inputText.length > 0
//               ? `${inputText.split(/\s+/).filter(Boolean).length} words`
//               : "no input yet"}
//           </p>
//         </div>

//         {/* ── MODE BUTTONS + HINT POPOVERS ── */}
//         <div className="relative flex flex-col items-center gap-4">
//           {/* Hint row */}
//           <div className="relative w-full flex justify-between items-center px-1">
//             {HINTS.map((hint) => (
//               <Popover key={hint.id}>
//                 <PopoverTrigger asChild>
//                   <button
//                     className="w-6 h-6 rounded-full border border-white/15 bg-white/5 text-white/35 text-xs font-bold hover:border-violet-400/50 hover:text-violet-300 hover:bg-violet-400/10 transition-all duration-200 flex items-center justify-center cursor-pointer"
//                     aria-label={hint.tip}
//                   >
//                     ?
//                   </button>
//                 </PopoverTrigger>
//                 <PopoverContent className="w-64 bg-[#17171f] border border-white/10 text-sm text-white/70 leading-relaxed shadow-2xl rounded-xl p-4">
//                   <p className="text-white/90 font-semibold text-xs uppercase tracking-wider mb-2">
//                     {hint.tip}
//                   </p>
//                   <p>{hint.text}</p>
//                 </PopoverContent>
//               </Popover>
//             ))}
//           </div>

//           {/* Mode buttons */}
//           <div className="flex gap-3 w-full">
//             {TABS.map((tab) => {
//               const isActive = activeTab === tab.id;
//               return (
//                 <button
//                   key={tab.id}
//                   onClick={() => setActiveTab(tab.id)}
//                   className={`
//                     flex-1 py-3 px-4 rounded-xl border font-medium text-sm tracking-wide
//                     transition-all duration-200 flex items-center justify-center gap-2
//                     ${
//                       isActive
//                         ? "bg-white/10 border-white/20 text-white shadow-lg"
//                         : "bg-white/[0.03] border-white/8 text-white/45 hover:bg-white/[0.06] hover:text-white/75 hover:border-white/15"
//                     }
//                   `}
//                   style={isActive ? { borderColor: `${tab.accent}55`, boxShadow: `0 0 20px ${tab.accent}20` } : {}}
//                 >
//                   <span style={isActive ? { color: tab.accent } : {}}>{tab.icon}</span>
//                   {tab.label}
//                 </button>
//               );
//             })}
//           </div>
//         </div>

//         {/* ── SUBPAGE ── */}
//         <div
//           key={activeTab}
//           className="rounded-2xl border border-white/8 overflow-hidden"
//           style={{
//             animation: "fadeSlideIn 0.25s ease forwards",
//           }}
//         >
//           {/* Gradient strip */}
//           <div
//             className={`h-1 w-full bg-gradient-to-r ${active.color}`}
//             style={{ background: `linear-gradient(90deg, ${active.accent}66, transparent)` }}
//           />

//           <div className="bg-white/[0.03] p-8 space-y-6">
//             <div className="flex items-center gap-3">
//               <span className="text-2xl" style={{ color: active.accent }}>
//                 {active.icon}
//               </span>
//               <h2
//                 className="text-xl font-semibold tracking-tight"
//                 style={{ fontFamily: "'Playfair Display', serif" }}
//               >
//                 {active.content.title}
//               </h2>
//             </div>

//             <p className="text-white/55 text-sm leading-relaxed">
//               {active.content.body}
//             </p>

//             {/* Stats grid */}
//             <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
//               {active.content.stats.map((stat) => (
//                 <Card
//                   key={stat.label}
//                   className="bg-white/[0.04] border-white/8 rounded-xl"
//                 >
//                   <CardContent className="p-4">
//                     <p className="text-[10px] text-white/30 uppercase tracking-widest mb-1">
//                       {stat.label}
//                     </p>
//                     <p
//                       className="text-lg font-bold"
//                       style={{ color: active.accent }}
//                     >
//                       {stat.value}
//                     </p>
//                   </CardContent>
//                 </Card>
//               ))}
//             </div>

//             {inputText.trim() === "" && (
//               <p className="text-xs text-white/20 italic pt-2">
//                 Enter text above to see real results here.
//               </p>
//             )}
//           </div>
//         </div>
//       </div>

//       <style>{`
//         @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&family=Playfair+Display:wght@700&display=swap');

//         @keyframes fadeSlideIn {
//           from { opacity: 0; transform: translateY(8px); }
//           to   { opacity: 1; transform: translateY(0); }
//         }
//       `}</style>
//     </div>
//   );
// }
export default function Page() {
  const [sequence, setSequence] = useState<string | null>(null);
  const [tool, setTool] = useState<"mimic" | "ko" | "feats" | null>(null);
  const [requestStarted, setRequestStarted] = useState<boolean>(false);
  return (
    <>
      <PageHeader
        sequenceState={[sequence, setSequence]}
        toolState={[tool, setTool]}
        disabled={requestStarted}
      ></PageHeader>
      <PageFooter
        sequence={sequence}
        tool={tool}
        requestStartedState={[requestStarted, setRequestStarted]}
      ></PageFooter>
    </>
  );
}
function PageHeader(props: {
  sequenceState: [string | null, (_: string | null) => void];
  toolState: [
    "mimic" | "ko" | "feats" | null,
    (_: "mimic" | "ko" | "feats" | null) => void,
  ];
  disabled: boolean;
}) {
  const {
    sequenceState: [sequence, setSequence],
    toolState,
    disabled,
  } = props;
  return (
    <>
      <SequenceArea
        disabled={disabled}
        setSequence={setSequence}
      ></SequenceArea>
      <ToolSelectionArea
        toolState={toolState}
        disabled={disabled || sequence === null}
      ></ToolSelectionArea>
    </>
  );
}
function PageFooter(props: {
  sequence: string | null;
  tool: "mimic" | "ko" | "feats" | null;
  requestStartedState: [boolean, (_: boolean) => void];
}) {
  const { sequence, tool, requestStartedState } = props;
  if (tool === null || sequence === null) return <></>;
  if (tool === "mimic") {
    return (
      <GenerateMimicArea
        sequence={sequence}
        featureConfiguration={FEATURE_CONFIGURATION}
        featureWeights={FEATURE_WEIGHTS}
        requestStartedState={requestStartedState}
      ></GenerateMimicArea>
    );
  }
}
