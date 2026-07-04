import { useState } from "react";
import { Send, CheckCircle } from "lucide-react";

export default function NewsletterSection() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) setSubmitted(true);
  };

  return (
    <section className="bg-[#F9FAFB] border-t border-[#E5E7EB] py-12">
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="grid grid-cols-1 gap-10 items-center">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 mb-4">
              Research Digest
            </div>
            <h2 className="text-[24px] font-bold text-gray-900 leading-tight mb-3">
              Stay Ahead of the Data
            </h2>
            <p className="text-[14px] text-gray-500 leading-relaxed max-w-[400px]">
              Get AndaraLab's weekly digest of Indonesia's key economic indicators,
              policy updates, and market-moving insights — delivered every Monday.
            </p>
            <div className="mt-5 flex flex-wrap gap-4">
              {["Weekly Research Digest", "Data Releases", "Policy Alerts"].map((tag) => (
                <div key={tag} className="flex items-center gap-1.5 text-[12px] text-gray-500">
                  <div className="w-1.5 h-1.5 rounded-full bg-gray-900" />
                  {tag}
                </div>
              ))}
            </div>
          </div>
          <div>
            {submitted ? (
              <div className="flex flex-col items-center justify-center text-center py-8 border border-[#E5E7EB] bg-white">
                <CheckCircle className="w-8 h-8 text-gray-900 mb-3" />
                <p className="text-[15px] font-semibold text-gray-900 mb-1">You're subscribed!</p>
                <p className="text-[13px] text-gray-400">First digest arrives Monday.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-3">
                <div>
                  <label className="block text-[11.5px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="w-full border border-[#D1D5DB] px-4 py-2.5 text-[13.5px] text-gray-900 placeholder-gray-300 focus:outline-none focus:border-gray-900 transition-colors bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11.5px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                    Topics (Optional)
                  </label>
                  <div className="flex flex-wrap gap-3">
                    {["Macro", "Monetary Policy", "Sectoral", "ESG", "Markets"].map((topic) => (
                      <label key={topic} className="flex items-center gap-1.5 cursor-pointer">
                        <input type="checkbox" className="accent-gray-900" />
                        <span className="text-[12.5px] text-gray-600">{topic}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <button
                  type="submit"
                  className="flex items-center gap-2 text-[13px] font-semibold text-white bg-gray-900 px-5 py-2.5 hover:bg-gray-700 transition-colors"
                >
                  <Send className="w-3.5 h-3.5" />
                  Subscribe to Digest
                </button>
                <p className="text-[11px] text-gray-400">No spam. Unsubscribe anytime.</p>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
