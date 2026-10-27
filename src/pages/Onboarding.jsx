import React, { useState } from "react";
import { Link } from "react-router-dom";
import Shell from "../components/Shell";
import { EmptyState, HeaderButton, Icon, LogoMark, Notice } from "../components/ui";
import { useWallet, isNuruConn } from "../wallet/WalletProvider";
import { accountName } from "../wallet/AccountMenu";
import { useStore, applyAsSeller } from "../lib/store";
import { withSignIn } from "../wallet/SignIn";
import { walletTail } from "../lib/format";
import { AFRICAN_COUNTRIES, ALL_COUNTRIES } from "../lib/countries";

const STEPS = ["About you", "What you sell", "Payout wallet", "Terms"];

function Field({ id, label, hint, children }) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="label">{label}</label>
      {children}
      {hint && <span className="hint">{hint}</span>}
    </div>
  );
}

function Status({ profile }) {
  if (profile.status === "approved") {
    return (
      <EmptyState icon="checkCircle" title="You're a seller" action={<Link to="/seller" className="btn-primary btn-sm">Open seller center</Link>}>
        {profile.name} is approved. Create your first listing from the seller center.
      </EmptyState>
    );
  }
  if (profile.status === "rejected") {
    return <EmptyState icon="alert" title="Application not approved">We couldn't approve {profile.name} this time. Contact support to find out why.</EmptyState>;
  }
  return (
    <EmptyState icon="clock" title="Application under review" action={<Link to="/" className="btn-secondary btn-sm">Keep shopping</Link>}>
      We'll email {profile.email} when a decision is made. You can keep shopping in the meantime.
    </EmptyState>
  );
}

function Onboarding() {
  const s = useStore();
  const { conn, openConnect } = useWallet();
  const [step, setStep] = useState(1);
  const [busy, setBusy] = useState(false);
  const [f, setF] = useState({ name: "", type: "Business", country: "Ghana", email: "", products: true, services: false, bio: "", portfolio: "", rights: false, terms: false });
  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value }));
  const profile = conn && s.sellers[conn.address.toLowerCase()];

  const valid = {
    1: f.name.trim().length >= 2 && /\S+@\S+\.\S+/.test(f.email),
    2: (f.products || f.services) && f.bio.trim().length >= 10,
    3: !!conn,
    4: f.rights && f.terms,
  }[step];

  const next = async () => {
    if (step < 4) return setStep(step + 1);
    setBusy(true);
    await applyAsSeller(conn.address, {
      name: f.name.trim(), type: f.type, country: f.country, email: f.email.trim(), bio: f.bio.trim(), portfolio: f.portfolio.trim(),
      sells: [f.products && "products", f.services && "services"].filter(Boolean),
    });
    setBusy(false);
  };

  return (
    <Shell footer={false}>
      <div className="mx-auto max-w-xl">
        <header className="flex h-[60px] items-center gap-1 px-2">
          <HeaderButton to="/" label="Back" />
          <h1 className="text-xl font-extrabold">Become a Seller</h1>
        </header>
        <main className="flex flex-col gap-6 px-5 pb-10">
          {!conn ? (
            <EmptyState icon="store" title="Sell on AlkeShop" action={<button type="button" onClick={() => openConnect().catch(() => { })} className="btn-primary btn-sm">Connect Nuru Wallet</button>}>
              Connect the Nuru Wallet you want to be paid in. Earnings are paid in ALKE.
            </EmptyState>
          ) : profile ? <Status profile={profile} /> : (
            <>
              <div className="flex flex-col gap-2">
                <div aria-hidden className="flex gap-1.5">
                  {STEPS.map((_, i) => <span key={i} className={`h-1.5 flex-1 rounded-full ${i + 1 < step ? "bg-violet" : i + 1 === step ? "bg-ink" : "bg-line"}`} />)}
                </div>
                <p className="text-sm font-bold text-mute">Step {step} of 4 · {STEPS[step - 1]}</p>
              </div>

              {step === 1 && (
                <form className="flex flex-col gap-5" onSubmit={(e) => e.preventDefault()}>
                  <h2 className="text-2xl font-extrabold">About you</h2>
                  <Field id="ob-name" label="Seller display name"><input id="ob-name" className="field" value={f.name} onChange={set("name")} autoComplete="organization" /></Field>
                  <fieldset className="flex flex-col gap-2">
                    <legend className="label mb-2">Account type</legend>
                    <div className="grid grid-cols-2 gap-2">
                      {["Individual", "Business"].map((t) => (
                        <label key={t} className={`flex min-h-[50px] cursor-pointer items-center gap-3 rounded-[14px] border px-4 font-bold ${f.type === t ? "border-violet bg-violet/10" : "border-line-2"}`}>
                          <input type="radio" name="ob-type" className="check" checked={f.type === t} onChange={() => setF((x) => ({ ...x, type: t }))} />{t}
                        </label>
                      ))}
                    </div>
                  </fieldset>
                  <Field id="ob-country" label="Country"><select id="ob-country" className="field" value={f.country} onChange={set("country")}>
                    <optgroup label="Africa">{AFRICAN_COUNTRIES.map((c) => <option key={c}>{c}</option>)}</optgroup>
                    <optgroup label="All countries">{ALL_COUNTRIES.map((c) => <option key={`all-${c}`}>{c}</option>)}</optgroup>
                  </select></Field>
                  <Field id="ob-email" label="Email" hint="We'll email you about your application and payouts."><input id="ob-email" type="email" className="field" value={f.email} onChange={set("email")} autoComplete="email" /></Field>
                </form>
              )}

              {step === 2 && (
                <form className="flex flex-col gap-5" onSubmit={(e) => e.preventDefault()}>
                  <h2 className="text-2xl font-extrabold">What you sell</h2>
                  <fieldset className="flex flex-col gap-2">
                    <legend className="label mb-2">I want to sell</legend>
                    {[["products", "Digital products"], ["services", "Services"]].map(([k, l]) => (
                      <label key={k} className="flex min-h-[50px] cursor-pointer items-center gap-3 rounded-[14px] border border-line-2 px-4 font-bold">
                        <input type="checkbox" className="check" checked={f[k]} onChange={set(k)} />{l}
                      </label>
                    ))}
                  </fieldset>
                  <Field id="ob-bio" label="Short description" hint="Shown on your seller profile."><textarea id="ob-bio" rows={4} className="field" value={f.bio} onChange={set("bio")} /></Field>
                  <Field id="ob-port" label="Portfolio or sample link (optional)"><input id="ob-port" type="url" inputMode="url" placeholder="https://" className="field" value={f.portfolio} onChange={set("portfolio")} /></Field>
                </form>
              )}

              {step === 3 && (
                <div className="flex flex-col gap-4">
                  <h2 className="text-2xl font-extrabold">Where should we pay you?</h2>
                  <p className="text-[15px] leading-relaxed text-body">Earnings are paid in ALKE to the wallet you connected. Approving the connection in Nuru proved it's yours; it never moves funds.</p>
                  <div className="card flex items-center gap-3 p-4">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet"><LogoMark size={22} fg="#0B0B0F" /></span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-bold">{isNuruConn(conn) ? "Nuru Wallet" : "Wallet"} {walletTail(conn.address)}</span>
                      <span className="block text-[13px] text-mute">{accountName(conn)} · linked to your account</span>
                    </span>
                    <span className="rounded-full bg-ok/15 px-2.5 py-1 text-[13px] font-bold text-ok">Verified</span>
                  </div>
                  <button type="button" onClick={() => openConnect().catch(() => { })} className="btn-text self-start">Use a different wallet</button>
                  <Notice tone="peach" icon="shield">For your safety, changing this wallet later pauses payouts for 72 hours and alerts your email.</Notice>
                </div>
              )}

              {step === 4 && (
                <form className="flex flex-col gap-4" onSubmit={(e) => e.preventDefault()}>
                  <h2 className="text-2xl font-extrabold">Review and agree</h2>
                  <ul className="flex flex-col gap-2.5">
                    {["Each sale has a marketplace fee, shown before you publish.", "Payouts are sent weekly to your verified wallet.", "Listings are reviewed before they go live."].map((t) => (
                      <li key={t} className="flex gap-2.5 text-[15px] text-body"><Icon name="check" size={18} className="mt-0.5 text-ok" />{t}</li>
                    ))}
                  </ul>
                  <label className="flex min-h-[44px] cursor-pointer items-start gap-3 text-[15px]"><input type="checkbox" className="check mt-0.5" checked={f.rights} onChange={set("rights")} />I own or have the rights to everything I will list.</label>
                  <label className="flex min-h-[44px] cursor-pointer items-start gap-3 text-[15px]"><input type="checkbox" className="check mt-0.5" checked={f.terms} onChange={set("terms")} /><span>I agree to the <Link to="/terms/seller">Seller Terms</Link>.</span></label>
                </form>
              )}

              <div className="flex gap-3">
                {step > 1 && <button type="button" onClick={() => setStep(step - 1)} className="btn-secondary flex-1">Back</button>}
                <button type="button" onClick={next} disabled={!valid || busy} className="btn-primary flex-[2]">{step === 4 ? (busy ? "Submitting…" : "Submit application") : "Continue"}</button>
              </div>
            </>
          )}
        </main>
      </div>
    </Shell>
  );
}

export default withSignIn(Onboarding, { what: "your seller application" });
