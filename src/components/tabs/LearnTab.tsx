import { useState } from "react";
import { motion } from "motion/react";
import { BookOpen, Sparkles, ChevronDown, CheckCircle2, HelpCircle } from "lucide-react";

export default function LearnTab() {
  const [activeAccordion, setActiveAccordion] = useState<number | null>(0);

  const pcosTypes = [
    {
      title: "1. Insulin-Resistant PCOS (70% of cases)",
      desc: "High insulin levels prevent normal ovulation and trigger ovaries to overproduce testosterone.",
      tips: ["Adopt a low-GI, high-fiber diet", "Prioritize 30-min daily walks post meals", "Incorporate Inositol & Berberine after medical consult"],
      color: "bg-pink-50 border-pink-200 text-pink-700",
    },
    {
      title: "2. Inflammatory PCOS",
      desc: "Chronic low-grade inflammation disrupts hormone receptors and increases androgen production.",
      tips: ["Eliminate ultra-processed foods & artificial sugars", "Increase Omega-3 fatty acids (flaxseeds, walnuts)", "Focus on gut health & antioxidant foods"],
      color: "bg-purple-50 border-purple-200 text-purple-700",
    },
    {
      title: "3. Post-Pill PCOS",
      desc: "Occurs temporarily after stopping oral contraceptive pills as the pituitary gland resets.",
      tips: ["Support liver detoxification (cruciferous veg)", "Replenish Zinc, B6, and Magnesium", "Track cycles patiently for 3-6 months"],
      color: "bg-amber-50 border-amber-200 text-amber-700",
    },
    {
      title: "4. Adrenal PCOS (10% of cases)",
      desc: "Driven by elevated DHEA-S stress hormones rather than ovarian androgens.",
      tips: ["Strict stress reduction & sleep hygiene (8 hrs)", "Avoid high-intensity exhaustive cardio", "Magnesium & Adaptogenic herbs (Ashwagandha)"],
      color: "bg-indigo-50 border-indigo-200 text-indigo-700",
    },
  ];

  const myths = [
    {
      q: "Myth: You cannot get pregnant if you have PCOS.",
      a: "Fact: PCOS is one of the most treatable causes of subfertility. With lifestyle modifications, ovulation tracking, and clinical guidance, most women conceive naturally or with minor medical support.",
    },
    {
      q: "Myth: PCOS only affects women who are overweight.",
      a: "Fact: 'Lean PCOS' accounts for 20% of cases. Women with normal or low BMI can still experience hormonal imbalances, androgen excess, and irregular ovulation.",
    },
    {
      q: "Myth: Birth control pills cure PCOS.",
      a: "Fact: OCPs mask symptoms by inducing withdrawal bleeds, but they do not reverse the root metabolic or hormonal cause. Symptoms often return after stopping the pill.",
    },
  ];

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="card-3d p-6 sm:p-8"
      >
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-100/80 flex items-center justify-center text-2xl shadow-sm border border-indigo-200/60">
            📖
          </div>
          <div>
            <h2 className="text-2xl font-serif-title font-bold text-gray-800">
              PCOS Knowledge Hub
            </h2>
            <p className="text-xs text-gray-400 font-medium mt-0.5">
              Evidence-based medical insights & lifestyle strategies
            </p>
          </div>
        </div>
      </motion.div>

      {/* The 4 Phenotypes */}
      <div className="space-y-4">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider pl-1">
          THE 4 ROOT-CAUSE TYPES OF PCOS
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {pcosTypes.map((type, i) => (
            <motion.div
              key={type.title}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="card-3d p-5 flex flex-col justify-between"
            >
              <div>
                <h4 className="font-serif-title font-bold text-gray-800 text-base mb-1.5">
                  {type.title}
                </h4>
                <p className="text-xs text-gray-500 leading-relaxed mb-3">
                  {type.desc}
                </p>
              </div>

              <div className="space-y-1.5 pt-2 border-t border-pink-100/60">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  Targeted Protocol:
                </span>
                {type.tips.map((tip) => (
                  <div key={tip} className="flex items-start gap-1.5 text-xs text-gray-700">
                    <CheckCircle2 className="w-3.5 h-3.5 text-pink-500 mt-0.5 shrink-0" />
                    <span>{tip}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Myths vs Facts Accordion */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="card-3d p-6 sm:p-8 space-y-4"
      >
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
          MYTH VS FACT INTERACTIVE GUIDELINES
        </h3>

        <div className="space-y-3">
          {myths.map((item, index) => {
            const isOpen = activeAccordion === index;
            return (
              <div
                key={index}
                className="bg-white/80 border border-pink-100 rounded-2xl overflow-hidden transition-all"
              >
                <button
                  type="button"
                  onClick={() => setActiveAccordion(isOpen ? null : index)}
                  className="w-full p-4 text-left flex items-center justify-between font-semibold text-gray-800 text-sm hover:bg-pink-50/50 cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <HelpCircle className="w-4 h-4 text-pink-500 shrink-0" />
                    {item.q}
                  </span>
                  <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                </button>

                {isOpen && (
                  <div className="px-4 pb-4 pt-1 text-xs text-gray-600 leading-relaxed border-t border-pink-50 bg-pink-50/30">
                    {item.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}
