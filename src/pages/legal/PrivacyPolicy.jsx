import React from "react";
import { Shield, Lock, Eye, Mail, FileText, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

const PrivacyPolicy = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 p-6 font-sans">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-sm text-slate-500 hover:text-indigo-600 transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-1" /> Back
          </button>
          <h1 className="text-3xl font-bold text-slate-800">Privacy Policy</h1>
          <p className="text-slate-500 mt-2">
            Last updated:{" "}
            <span className="font-medium text-slate-700">
              December 31, 2025
            </span>
          </p>
        </div>

        {/* Content Card */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-8 space-y-8">
            {/* Introduction */}
            <section>
              <p className="text-slate-600 leading-relaxed">
                At{" "}
                <span className="font-bold text-indigo-600">Baba Car Wash</span>
                , we value your privacy and are committed to protecting your
                personal data. This Privacy Policy explains how we collect, use,
                and safeguard your information when you use our admin panel and
                services.
              </p>
            </section>

            {/* Information We Collect */}
            <section>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                  <FileText className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-bold text-slate-800">
                  Information We Collect
                </h2>
              </div>
              <ul className="space-y-3 text-slate-600 list-disc pl-5 marker:text-indigo-300">
                <li>
                  <span className="font-semibold text-slate-700">
                    Personal Information:
                  </span>{" "}
                  Name, email address, phone number, and building/flat details.
                </li>
                <li>
                  <span className="font-semibold text-slate-700">
                    Vehicle Data:
                  </span>{" "}
                  Registration numbers, parking numbers, vehicle models, and
                  service history.
                </li>
                <li>
                  <span className="font-semibold text-slate-700">
                    Usage Data:
                  </span>{" "}
                  Login logs, IP addresses, and activity within the dashboard
                  for security purposes.
                </li>
              </ul>
            </section>

            {/* How We Use Data */}
            <section>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
                  <Eye className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-bold text-slate-800">
                  How We Use Your Data
                </h2>
              </div>
              <p className="text-slate-600 mb-3">
                We use the collected data to:
              </p>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[
                  "Manage car wash schedules and worker assignments.",
                  "Process payments and generate invoices.",
                  "Communicate service updates via SMS or Email.",
                  "Improve our operational efficiency and dashboard features.",
                ].map((item, idx) => (
                  <li
                    key={idx}
                    className="flex items-start gap-2 text-slate-600 text-sm bg-slate-50 p-3 rounded border border-slate-100"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </section>

            {/* Data Security */}
            <section>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center text-orange-600">
                  <Lock className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-bold text-slate-800">
                  Data Security
                </h2>
              </div>
              <p className="text-slate-600 leading-relaxed">
                We implement industry-standard security measures, including
                encryption and secure server access, to protect your data from
                unauthorized access, alteration, or disclosure. However, no
                method of transmission over the internet is 100% secure.
              </p>
            </section>

            {/* Contact Us */}
            <section className="bg-slate-50 rounded-xl p-6 border border-slate-200">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
                  <Mail className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-bold text-slate-800">Contact Us</h2>
              </div>
              <p className="text-slate-600 mb-2">
                If you have any questions about this Privacy Policy, please
                contact us:
              </p>
              <div className="text-slate-700 font-medium">
                <p>
                  Email:{" "}
                  <a
                    href="mailto:support@babacarwash.com"
                    className="text-indigo-600 hover:underline"
                  >
                    support@babacarwash.com
                  </a>
                </p>
                <p className="mt-1">Phone: +971 50 123 4567</p>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
