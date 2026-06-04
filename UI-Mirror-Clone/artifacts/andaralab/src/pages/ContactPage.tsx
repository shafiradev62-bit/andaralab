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

  const contactItems = [
    { icon: Mail,   label: t("contact_email_label"),   value: "research@andaralab.id" },
    { icon: Phone,  label: t("contact_phone_label"),   value: "(+62) 812-1314-5883" },
    { icon: MapPin, label: t("contact_address_label"), value: "Jl. Pekayon 1 no 30C, Ragunan, Jakarta Selatan" },
  ];

  return (
    <div className="bg-white">
      <section className="border-b border-[#E5E7EB] py-16">
        <div className="max-w-[1200px] mx-auto px-6">
          <div className="text-[11px] font-semibold uppercase tracking-widest text-gray-900 mb-4">
            {t("contact_label_header")}
          </div>
          <h1 className="text-[38px] font-bold text-gray-900 mb-4">
            {t("contact_get_in_touch")}
          </h1>
          <p className="text-[15px] text-gray-500 max-w-[500px]">
            {t("contact_subtitle")}
          </p>
        </div>
      </section>

      <section className="py-16">
        <div className="max-w-[1200px] mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-10">
          {/* Info */}
          <div className="md:col-span-1">
            <h2 className="text-[17px] font-semibold text-gray-900 mb-6">{t("contact_info_title")}</h2>
            <div className="space-y-5">
              {contactItems.map((c) => (
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
                <h3 className="text-[18px] font-semibold text-gray-900 mb-2">{t("contact_sent_title")}</h3>
                <p className="text-[13.5px] text-gray-500">{t("contact_sent_body")}</p>
                <button
                  onClick={() => setSubmitted(false)}
                  className="mt-6 text-[13px] text-gray-900 font-medium hover:underline"
                >
                  {t("contact_send_another")}
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(["name", "email", "organization"] as const).map((field) => (
                    <div key={field} className={field === "organization" ? "md:col-span-2" : ""}>
                      <label className="block text-[12px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                        {field === "name"
                          ? t("contact_form_fullname")
                          : field === "email"
                          ? t("contact_form_email")
                          : t("contact_form_org")}{" "}
                        {field !== "organization" && <span className="text-red-400">*</span>}
                      </label>
                      <input
                        required={field !== "organization"}
                        type={field === "email" ? "email" : "text"}
                        value={form[field]}
                        onChange={(e) => setForm({ ...form, [field]: e.target.value })}
                        className="w-full border border-[#E5E7EB] px-3 py-2.5 text-[13.5px] text-gray-900 focus:outline-none focus:border-gray-900 transition-colors bg-white"
                        placeholder={
                          field === "name"
                            ? t("contact_form_placeholder_name")
                            : field === "email"
                            ? t("contact_form_placeholder_email")
                            : t("contact_form_placeholder_org")
                        }
                      />
                    </div>
                  ))}
                </div>
                <div>
                  <label className="block text-[12px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                    {t("contact_form_subject")} <span className="text-red-400">*</span>
                  </label>
                  <select
                    required
                    value={form.subject}
                    onChange={(e) => setForm({ ...form, subject: e.target.value })}
                    className="w-full border border-[#E5E7EB] px-3 py-2.5 text-[13.5px] text-gray-900 focus:outline-none focus:border-gray-900 transition-colors bg-white"
                  >
                    <option value="">{t("contact_form_select")}</option>
                    <option>{t("contact_form_partnership")}</option>
                    <option>{t("contact_form_subscription")}</option>
                    <option>{t("contact_form_media")}</option>
                    <option>{t("contact_form_general")}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[12px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                    {t("contact_form_message")} <span className="text-red-400">*</span>
                  </label>
                  <textarea
                    required
                    rows={5}
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    className="w-full border border-[#E5E7EB] px-3 py-2.5 text-[13.5px] text-gray-900 focus:outline-none focus:border-gray-900 transition-colors bg-white resize-none"
                    placeholder={t("contact_form_placeholder_message")}
                  />
                </div>
                <button
                  type="submit"
                  className="flex items-center gap-2 text-[13.5px] font-medium text-white bg-gray-900 px-6 py-2.5 hover:bg-gray-700 transition-colors"
                >
                  <Send className="w-4 h-4" />
                  {t("contact_form_send")}
                </button>
              </form>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
