"use client";

import { useState } from "react";
import { ShieldCheck } from "lucide-react";

interface PartnerCodeValidatorProps {
  companyId: string;
  validate: (code: string) => Promise<void>;
}

export function PartnerCodeValidator({ companyId, validate }: PartnerCodeValidatorProps) {
  const [code, setCode] = useState("");
  const [feedback, setFeedback] = useState("");

  const handleValidate = async () => {
    setFeedback("");
    if (!code.trim()) {
      setFeedback("Digite um código para validar.");
      return;
    }
    await validate(code);
    setCode("");
  };

  return (
    <section className="card grid gap-2.5">
      <div className="flex items-center gap-2">
        <ShieldCheck size={20} className="text-[var(--brand)]" />
        <h2 style={{ margin: 0, fontSize: 18, fontFamily: "var(--font-poppins), sans-serif", fontWeight: 700, color: "#0f1a13" }}>
          Validar código de benefício
        </h2>
      </div>
      <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
        <input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Digite o código (6 dígitos)"
          style={{ border: "1px solid var(--line)", borderRadius: 10, padding: "10px 12px" }}
          onKeyDown={(e) => { if (e.key === "Enter") handleValidate(); }}
        />
        <button className="btn btn-primary sm:!w-auto" onClick={handleValidate}>
          Validar
        </button>
      </div>
      {feedback && (
        <p style={{ margin: 0, fontWeight: 700, color: feedback.includes("sucesso") ? "var(--success-text)" : "var(--error-text)" }}>
          {feedback}
        </p>
      )}
    </section>
  );
}