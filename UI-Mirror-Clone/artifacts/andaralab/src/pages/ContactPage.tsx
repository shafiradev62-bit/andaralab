import { useState, useEffect } from "react";
import { Mail, MapPin, Phone, Send, CheckCircle } from "lucide-react";
import { useLocale } from "@/lib/locale";
import { applyDocumentSeo } from "@/lib/document-meta";

export default function ContactPage() {
  const { t } = useLocale();
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    name: "", email: "", organization: "", subject: "", message: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  useEffect(() => {
    applyDocumentSeo({
      title: t("nav_contact"),
      description: t("meta_contact_description"),
      pathname: "/contact",
    });
  }, [t]);

  return (
    <div className="bg-white">
      <section className="border-b border-[#E5E7EB] py-16">
        <div className="max-w-[1200px] mx-auto px-6">
          <div className="text-[11px] font-semibold uppercase tracking-widest text-gray-900 mb-4">
            Contact
          </div>
          <h1 className="text-[38px] font-bold text-gray-900 mb-4">
            Get in Touch
          </h1>
          <p className="text-[15px] text-gray-500 max-w-[500px]">
            Reach out to our research team for partnerships, research inquiries,
            or media requests.
          </p>
        </div>
      </section>

      <section className="py-16">
        <div className="max-w-[1200px] mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-10">
          {/* Info */}
          <div className="md:col-span-1">
            <h2 className="text-[17px] font-semibold text-gray-900 mb-6">Contact Information</h2>
            <div className="space-y-5">
              {[
                { icon: Mail, label: "Email", value: "research@andaralab.id" },
                { icon: Phone, label: "Phone", value: "(+62) 812-1314-5883" },
                { icon: MapPin, label: "Address", value: "Jl. Pekayon 1 no 30C, Ragunan, Jakarta Selatan" },
              ].map((c) => (
                <div key={c.label} className="flex items-start gap-3">
                  <div className="w-9 h-9 bg-[#f0f4f9] flex items-center justify-center flex-shrink-0 mt-0.5">
                    <c.icon className="w-4 h-4 text-gray-900" />
                  </div>
                  <div>
                    <div className="text-[11.5px] text-gray-400 font-medium mb-0.5">{c.label}</div>
                    <div className="text-[13.5px] text-gray-800">{c.value}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Form */}
          <div className="md:col-span-2 border border-[#E5E7EB] p-8">
            {submitted ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <CheckCircle className="w-12 h-12 text-gray-900 mb-4" />
                <h3 className="text-[18px] font-semibold text-gray-900 mb-2">Message Sent</h3>
                <p className="text-[13.5px] text-gray-500">We'll get back to you within 1-2 business days.</p>
                <button
                  onClick={() => setSubmitted(false)}
                  className="mt-6 text-[13px] text-gray-900 font-medium hover:underline"
                >
                  Send another message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(["name", "email", "organization"] as const).map((field) => (
                    <div key={field} className={field === "organization" ? "md:col-span-2" : ""}>
                      <label className="block text-[12px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                        {field === "name" ? "Full Name" : field === "email" ? "Email Address" : "Organization"}{" "}
                        {field !== "organization" && <span className="text-red-400">*</span>}
                      </label>
                      <input
                        required={field !== "organization"}
                        type={field === "email" ? "email" : "text"}
                        value={form[field]}
                        onChange={(e) => setForm({ ...form, [field]: e.target.value })}
                        className="w-full border border-[#E5E7EB] px-3 py-2.5 text-[13.5px] text-gray-900 focus:outline-none focus:border-gray-900 transition-colors bg-white"
                        placeholder={field === "name" ? "Your name" : field === "email" ? "your@email.com" : "Company or institution"}
                      />
                    </div>
                  ))}
                </div>
                <div>
                  <label className="block text-[12px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                    Subject <span className="text-red-400">*</span>
                  </label>
                  <select
                    required
                    value={form.subject}
                    onChange={(e) => setForm({ ...form, subject: e.target.value })}
                    className="w-full border border-[#E5E7EB] px-3 py-2.5 text-[13.5px] text-gray-900 focus:outline-none focus:border-gray-900 transition-colors bg-white"
                  >
                    <option value="">Select subject</option>
                    <option>Research Partnership</option>
                    <option>Data Subscription</option>
                    <option>Media Inquiry</option>
                    <option>General Question</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[12px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                    Message <span className="text-red-400">*</span>
                  </label>
                  <textarea
                    required
                    rows={5}
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    className="w-full border border-[#E5E7EB] px-3 py-2.5 text-[13.5px] text-gray-900 focus:outline-none focus:border-gray-900 transition-colors bg-white resize-none"
                    placeholder="Describe your inquiry..."
                  />
                </div>
                <button
                  type="submit"
                  className="flex items-center gap-2 text-[13.5px] font-medium text-white bg-gray-900 px-6 py-2.5 hover:bg-gray-700 transition-colors"
                >
                  <Send className="w-4 h-4" />
                  Send Message
                </button>
              </form>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
