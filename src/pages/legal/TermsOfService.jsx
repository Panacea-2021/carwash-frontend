import React from "react";
import {
  Scale,
  AlertCircle,
  FileCheck,
  Ban,
  ArrowLeft,
  CheckCircle2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const TermsOfService = () => {
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
          <h1 className="text-3xl font-bold text-slate-800">
            Terms of Service
          </h1>
          <p className="text-slate-500 mt-2">
            Last updated:{" "}
            <span className="font-medium text-slate-700">
              December 31, 2025
            </span>
          </p>
        </div>

        {/* Content Card */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-8 space-y-10">
            {/* Agreement */}
            <section>
              <p className="text-slate-600 text-lg leading-relaxed border-l-4 border-indigo-500 pl-4 bg-slate-50 py-2 rounded-r">
                By accessing or using the{" "}
                <span className="font-bold text-slate-800">Baba Car Wash</span>{" "}
                platform, you agree to be bound by these Terms. If you disagree
                with any part of the terms, you may not access the service.
              </p>
            </section>

            {/* Accounts */}
            <section>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                  <FileCheck className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-bold text-slate-800">
                  User Accounts
                </h2>
              </div>
              <p className="text-slate-600 mb-4">
                When you create an account with us, you must provide information
                that is accurate, complete, and current. Failure to do so
                constitutes a breach of the Terms.
              </p>
              <ul className="space-y-2">
                {[
                  "You are responsible for safeguarding your password.",
                  "You must notify us immediately of any breach of security.",
                  "You may not use a username that is offensive or infringes on rights.",
                ].map((text, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 text-slate-600 text-sm"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                    <span>{text}</span>
                  </li>
                ))}
              </ul>
            </section>

            {/* Termination */}
            <section>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center text-red-600">
                  <Ban className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-bold text-slate-800">
                  Termination
                </h2>
              </div>
              <p className="text-slate-600 leading-relaxed">
                We may terminate or suspend access to our Service immediately,
                without prior notice or liability, for any reason whatsoever,
                including without limitation if you breach the Terms. Upon
                termination, your right to use the Service will immediately
                cease.
              </p>
            </section>

            {/* Limitation of Liability */}
            <section>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-bold text-slate-800">
                  Limitation of Liability
                </h2>
              </div>
              <p className="text-slate-600 leading-relaxed">
                In no event shall Baba Car Wash, nor its directors, employees,
                partners, agents, suppliers, or affiliates, be liable for any
                indirect, incidental, special, consequential or punitive
                damages, including without limitation, loss of profits, data,
                use, goodwill, or other intangible losses.
              </p>
            </section>

            {/* Governing Law */}
            <section>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600">
                  <Scale className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-bold text-slate-800">
                  Governing Law
                </h2>
              </div>
              <p className="text-slate-600 leading-relaxed">
                These Terms shall be governed and construed in accordance with
                the laws of the United Arab Emirates, without regard to its
                conflict of law provisions.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsOfService;
