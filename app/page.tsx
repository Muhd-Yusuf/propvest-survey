"use client";

import { useState, useEffect } from "react";

/* ──────────────────────────────────────────────────────────
   TYPES
   ────────────────────────────────────────────────────────── */
interface SurveyData {
  fullName: string;
  email: string;
  phone: string;
  ageRange: string;
  incomeRange: string;
  investedBefore: string;
  howInvested: string;
  wouldInvest: string;
  propertyTypeInterest: string[];
  startingAmount: string;
  whatsStoppingYou: string[];
  preferredPayment: string;
  heardAboutUs: string;
}

/* ──────────────────────────────────────────────────────────
   CONSTANTS
   ────────────────────────────────────────────────────────── */
const EMERALD = "#00D4AA";

/* ──────────────────────────────────────────────────────────
   REUSABLE COMPONENTS
   ────────────────────────────────────────────────────────── */
function RadioGroup({
  name,
  options,
  value,
  onChange,
}: {
  name: string;
  options: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => (
        <label
          key={opt.value}
          className={`cursor-pointer px-4 py-2.5 rounded-lg border text-sm transition-all ${
            value === opt.value
              ? "border-[#00D4AA] bg-[#00D4AA]/10 text-white"
              : "border-white/10 bg-white/[0.03] text-white/60 hover:border-white/20 hover:bg-white/[0.06]"
          }`}
        >
          <input
            type="radio"
            name={name}
            value={opt.value}
            checked={value === opt.value}
            onChange={() => onChange(opt.value)}
            className="hidden"
          />
          {opt.label}
        </label>
      ))}
    </div>
  );
}

function CheckboxGroup({
  options,
  values,
  onChange,
}: {
  options: { value: string; label: string }[];
  values: string[];
  onChange: (v: string[]) => void;
}) {
  const toggle = (val: string) => {
    onChange(
      values.includes(val)
        ? values.filter((v) => v !== val)
        : [...values, val]
    );
  };
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => (
        <label
          key={opt.value}
          className={`cursor-pointer px-4 py-2.5 rounded-lg border text-sm transition-all ${
            values.includes(opt.value)
              ? "border-[#00D4AA] bg-[#00D4AA]/10 text-white"
              : "border-white/10 bg-white/[0.03] text-white/60 hover:border-white/20 hover:bg-white/[0.06]"
          }`}
        >
          <input
            type="checkbox"
            checked={values.includes(opt.value)}
            onChange={() => toggle(opt.value)}
            className="hidden"
          />
          {opt.label}
        </label>
      ))}
    </div>
  );
}

function TextInput({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-sm text-white/70 mb-1.5">
        {label} <span className="text-[#00D4AA]">*</span>
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required
        className="w-full px-4 py-3 rounded-lg bg-white/[0.05] border border-white/10 text-white placeholder:text-white/30 outline-none focus:border-[#00D4AA]/50 focus:ring-1 focus:ring-[#00D4AA]/20 transition-all text-sm"
      />
    </div>
  );
}

function Q({
  label,
  sub,
  children,
}: {
  label: string;
  sub?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2.5">
      <p className="text-sm text-white/70">{label}</p>
      {sub && <p className="text-xs text-white/30 -mt-1">{sub}</p>}
      {children}
    </div>
  );
}

/* ──────────────────────────────────────────────────────────
   MAIN PAGE
   ────────────────────────────────────────────────────────── */
export default function SurveyPage() {
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [responseCount, setResponseCount] = useState(0);

  const [data, setData] = useState<SurveyData>({
    fullName: "",
    email: "",
    phone: "",
    ageRange: "",
    incomeRange: "",
    investedBefore: "",
    howInvested: "",
    wouldInvest: "",
    propertyTypeInterest: [],
    startingAmount: "",
    whatsStoppingYou: [],
    preferredPayment: "",
    heardAboutUs: "",
  });

  useEffect(() => {
    fetch("/api/count")
      .then((r) => r.json())
      .then((d) => setResponseCount(d.count))
      .catch(() => {});
  }, []);

  const update = (key: keyof SurveyData, val: string | string[]) =>
    setData((p) => ({ ...p, [key]: val }));

  const interested = ["definitely", "probably", "maybe"].includes(data.wouldInvest);

  const submit = async () => {
    setSubmitting(true);
    try {
      const res = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "investor", ...data }),
      });

      if (res.ok) {
        setStep(2);
        setResponseCount((c) => c + 1);
      }
    } catch {
      alert("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // ── LANDING ──
  if (step === 0) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center px-4">
        <div className="text-center max-w-lg">
          <div className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#00D4AA] to-[#00B894] flex items-center justify-center">
              <span className="text-white font-bold text-lg">P</span>
            </div>
            <span className="text-2xl font-bold tracking-tight">PropVest</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-6 leading-tight">
            Our research shows that{" "}
            <span className="text-[#00D4AA]">8 out of 10 Nigerians</span>{" "}
            want to invest in real estate, but almost nobody has ₦50M
            to buy land or property outright.
          </h1>

          <div className="text-left max-w-md mx-auto space-y-4 mb-6">
            <p className="text-white/60 text-sm leading-relaxed">
              Let&apos;s be honest. You&apos;ve thought about investing in
              property before. Maybe you even looked into it. But then you saw
              the prices and realized it&apos;s not for &ldquo;people like
              us&rdquo; yet. ₦20M, ₦50M, ₦100M. Where that kind of money dey?
            </p>
            <p className="text-white/60 text-sm leading-relaxed">
              Meanwhile, developers are building estates, landlords are
              collecting rent, and property keeps appreciating every single year.
              The opportunity is right there. You just can&apos;t access it.
            </p>
            <p className="text-white/50 text-sm leading-relaxed">
              <span className="text-[#00D4AA] font-semibold">PropVest</span>{" "}
              is changing that. We&apos;re connecting everyday people with
              trusted, verified developers so you can invest what you have, join
              others, and own your share of a real property with proper
              documentation and real returns.
            </p>
          </div>

          <p className="text-white/40 text-xs max-w-sm mx-auto leading-relaxed">
            Before we build, we want to hear from people like you.
            Answer a few quick questions. It shapes everything.
          </p>

          <button
            onClick={() => setStep(1)}
            className="mt-8 px-8 py-3.5 rounded-xl bg-gradient-to-r from-[#00D4AA] to-[#00B894] text-white font-semibold text-sm hover:opacity-90 transition-opacity cursor-pointer"
          >
            That&apos;s me — I want in
          </button>
          <p className="text-white/25 text-xs mt-3">Takes less than 2 minutes</p>

          {responseCount > 0 && (
            <p className="mt-6 text-xs text-white/30">
              <span className="text-[#00D4AA] font-semibold">{responseCount}</span>{" "}
              {responseCount === 1 ? "person has" : "people have"} responded so far
            </p>
          )}
        </div>
      </main>
    );
  }

  // ── THANK YOU ──
  if (step === 2) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center px-4 text-center">
        <div className="w-16 h-16 rounded-full bg-[#00D4AA]/10 flex items-center justify-center mb-6">
          <svg width="32" height="32" fill="none" viewBox="0 0 24 24" stroke={EMERALD} strokeWidth="2">
            <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <h2 className="text-2xl font-bold mb-2">Thank you!</h2>
        <p className="text-white/50 max-w-sm text-sm leading-relaxed mb-6">
          Your response has been recorded. You&apos;ll be among the first to
          know when we launch.
        </p>
        <p className="text-xs text-white/30">
          <span className="text-[#00D4AA] font-semibold">{responseCount}</span>{" "}
          people have responded
        </p>
        <button
          onClick={() => {
            setStep(0);
            setData({
              fullName: "", email: "", phone: "", ageRange: "", incomeRange: "",
              investedBefore: "", howInvested: "", wouldInvest: "",
              propertyTypeInterest: [], startingAmount: "",
              whatsStoppingYou: [], preferredPayment: "", heardAboutUs: "",
            });
          }}
          className="mt-6 text-sm text-[#00D4AA] hover:underline cursor-pointer"
        >
          Submit another response
        </button>
      </main>
    );
  }

  // ── SURVEY FORM ──
  return (
    <main className="min-h-screen py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => setStep(0)}
            className="text-sm text-white/40 hover:text-white/70 transition-colors flex items-center gap-1 cursor-pointer"
          >
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Back
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#00D4AA] to-[#00B894] flex items-center justify-center">
              <span className="text-white font-bold text-xs">P</span>
            </div>
            <span className="font-semibold text-sm">PropVest</span>
          </div>
        </div>

        {/* Context banner */}
        <div className="rounded-xl border border-[#00D4AA]/20 bg-[#00D4AA]/[0.04] px-5 py-4 mb-8">
          <p className="text-sm text-white/70 leading-relaxed">
            <span className="text-[#00D4AA] font-semibold">How PropVest works:</span>{" "}
            Trusted developers list their property projects on our platform. You invest
            what you can (even ₦50K) and join other investors to fund the property together.
            The developer builds or manages it, you earn returns. Everything is documented,
            every developer is verified. Think of it like buying shares in MTN, Dangote, or BUA on the stock
            market, but this time in real estate.
          </p>
        </div>

        <div className="space-y-6">
          {/* Contact */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <TextInput label="Full Name" value={data.fullName} onChange={(v) => update("fullName", v)} placeholder="Your full name" />
            <TextInput label="Email" type="email" value={data.email} onChange={(v) => update("email", v)} placeholder="you@email.com" />
          </div>
          <TextInput label="Phone" type="tel" value={data.phone} onChange={(v) => update("phone", v)} placeholder="08012345678" />

          {/* About you */}
          <Q label="Your age range?">
            <RadioGroup name="ageRange" value={data.ageRange} onChange={(v) => update("ageRange", v)}
              options={[
                { value: "18-24", label: "18–24" },
                { value: "25-34", label: "25–34" },
                { value: "35-44", label: "35–44" },
                { value: "45-54", label: "45–54" },
                { value: "55+", label: "55+" },
              ]}
            />
          </Q>

          <Q label="Monthly income range?">
            <RadioGroup name="incomeRange" value={data.incomeRange} onChange={(v) => update("incomeRange", v)}
              options={[
                { value: "under-100k", label: "Under ₦100K" },
                { value: "100k-300k", label: "₦100K – ₦300K" },
                { value: "300k-500k", label: "₦300K – ₦500K" },
                { value: "500k-1m", label: "₦500K – ₦1M" },
                { value: "above-1m", label: "Above ₦1M" },
              ]}
            />
          </Q>

          {/* Experience */}
          <Q label="Have you invested in property before?">
            <RadioGroup name="investedBefore" value={data.investedBefore} onChange={(v) => update("investedBefore", v)}
              options={[
                { value: "yes", label: "Yes" },
                { value: "no", label: "No" },
              ]}
            />
          </Q>

          {data.investedBefore === "yes" && (
            <Q label="How did you invest?">
              <RadioGroup name="howInvested" value={data.howInvested} onChange={(v) => update("howInvested", v)}
                options={[
                  { value: "direct-purchase", label: "Bought property" },
                  { value: "cooperative", label: "Cooperative" },
                  { value: "reit", label: "REIT / Fund" },
                  { value: "crowdfunding", label: "Crowdfunding" },
                  { value: "other", label: "Other" },
                ]}
              />
            </Q>
          )}

          {/* The key question */}
          <Q label="If you could put in ₦50K–₦500K into a real property managed by a trusted developer — and earn when it sells or from rent — would you do it?">
            <RadioGroup name="wouldInvest" value={data.wouldInvest} onChange={(v) => update("wouldInvest", v)}
              options={[
                { value: "definitely", label: "Definitely" },
                { value: "probably", label: "Most likely" },
                { value: "maybe", label: "Maybe" },
                { value: "not-sure", label: "I need to understand more" },
              ]}
            />
          </Q>

          {/* Conditional — only if interested */}
          {interested && (
            <>
              <Q label="What kind of property would you put your money in?" sub="Pick all that apply">
                <CheckboxGroup values={data.propertyTypeInterest} onChange={(v) => update("propertyTypeInterest", v)}
                  options={[
                    { value: "rental", label: "Rental property (earn from rent)" },
                    { value: "build-sell", label: "Build & Sell (earn when it sells)" },
                    { value: "land", label: "Land (hold and let value grow)" },
                  ]}
                />
              </Q>

              <Q label="How much would you start with?">
                <RadioGroup name="startingAmount" value={data.startingAmount} onChange={(v) => update("startingAmount", v)}
                  options={[
                    { value: "50k-100k", label: "₦50K – ₦100K" },
                    { value: "100k-300k", label: "₦100K – ₦300K" },
                    { value: "300k-500k", label: "₦300K – ₦500K" },
                    { value: "500k-1m", label: "₦500K – ₦1M" },
                    { value: "above-1m", label: "Above ₦1M" },
                  ]}
                />
              </Q>

              <Q label="What has been stopping you from investing in property till now?" sub="Pick all that apply — be honest, this helps us solve the real problems">
                <CheckboxGroup values={data.whatsStoppingYou} onChange={(v) => update("whatsStoppingYou", v)}
                  options={[
                    { value: "no-capital", label: "Money no reach" },
                    { value: "no-trust", label: "I no trust these platforms" },
                    { value: "no-knowledge", label: "I don't know how to start" },
                    { value: "no-access", label: "I no know any reliable developer" },
                    { value: "nothing", label: "Nothing — I'm ready if the platform is real" },
                  ]}
                />
              </Q>
            </>
          )}

          {/* Wrap up */}
          <Q label="How would you prefer to pay?">
            <RadioGroup name="preferredPayment" value={data.preferredPayment} onChange={(v) => update("preferredPayment", v)}
              options={[
                { value: "bank-transfer", label: "Bank Transfer" },
                { value: "card", label: "Debit Card" },
                { value: "ussd", label: "USSD" },
                { value: "any", label: "Any" },
              ]}
            />
          </Q>

          <Q label="How did you hear about PropVest?">
            <RadioGroup name="heardAboutUs" value={data.heardAboutUs} onChange={(v) => update("heardAboutUs", v)}
              options={[
                { value: "social-media", label: "Social Media" },
                { value: "friend", label: "Friend / Family" },
                { value: "whatsapp", label: "WhatsApp" },
                { value: "search", label: "Google" },
                { value: "other", label: "Other" },
              ]}
            />
          </Q>

          {/* Submit */}
          <div className="pt-4 pb-8">
            <button
              onClick={submit}
              disabled={submitting}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#00D4AA] to-[#00B894] text-white font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
            >
              {submitting ? "Submitting..." : "Submit"}
            </button>
            <p className="text-center text-xs text-white/25 mt-3">
              Your data is private and only used for product research
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
