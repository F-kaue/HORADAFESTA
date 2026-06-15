"use client";

import Image from "next/image";
import { renderContractBody, type ContractVariables } from "@/lib/contracts/template";
import { cn } from "@/lib/utils";

type ContractPreviewProps = {
  template: string;
  variables: ContractVariables;
  businessName: string;
  cnpj?: string | null;
  logoUrl?: string;
  className?: string;
  id?: string;
};

export function ContractPreview({
  template,
  variables,
  businessName,
  cnpj,
  logoUrl = "/logo.png",
  className,
  id = "contract-preview",
}: ContractPreviewProps) {
  const body = renderContractBody(template, variables);
  const lines = body.split("\n");

  return (
    <article
      id={id}
      className={cn(
        "mx-auto max-w-[720px] rounded-sm border border-stone-200 bg-[#fffef9] px-8 py-10 shadow-lg sm:px-12 sm:py-14",
        "font-serif text-[13px] leading-[1.75] text-stone-900",
        className
      )}
    >
      <header className="mb-8 border-b-2 border-primary/80 pb-6 text-center">
        {logoUrl && (
          <div className="mb-4 flex justify-center">
            <Image
              src={logoUrl}
              alt={businessName}
              width={72}
              height={72}
              className="h-14 w-auto object-contain sm:h-16"
            />
          </div>
        )}
        <p className="text-[10px] font-sans font-bold uppercase tracking-[0.35em] text-stone-500">
          {businessName}
        </p>
        {cnpj && (
          <p className="mt-1 font-sans text-[11px] text-stone-500">CNPJ: {cnpj}</p>
        )}
      </header>

      <div className="space-y-1">
        {lines.map((line, i) => {
          const trimmed = line.trim();
          if (trimmed === "⸻") {
            return (
              <div
                key={i}
                className="my-4 text-center text-xs tracking-[0.4em] text-stone-400"
              >
                ⸻
              </div>
            );
          }
          if (trimmed.startsWith("CONTRATO DE")) {
            return (
              <h1
                key={i}
                className="mb-6 text-center text-sm font-bold uppercase tracking-wide text-stone-900"
              >
                {trimmed}
              </h1>
            );
          }
          if (trimmed.startsWith("CLÁUSULA")) {
            return (
              <h2 key={i} className="mt-5 font-bold text-stone-900">
                {trimmed}
              </h2>
            );
          }
          if (
            trimmed.startsWith("CONTRATADA:") ||
            trimmed.startsWith("CONTRATANTE:") ||
            trimmed.startsWith("CPF:") ||
            trimmed.startsWith("Telefone:") ||
            trimmed.startsWith("Endereço") ||
            trimmed.startsWith("Data do Evento:") ||
            trimmed.startsWith("Horário")
          ) {
            return (
              <p key={i} className="text-stone-800">
                {line.split(":").length > 1 ? (
                  <>
                    <span className="font-bold">{line.split(":")[0]}:</span>
                    {line.slice(line.indexOf(":") + 1)}
                  </>
                ) : (
                  line
                )}
              </p>
            );
          }
          if (trimmed === "CONTRATANTE" || trimmed.endsWith("— CONTRATADA")) {
            return (
              <p key={i} className="mt-8 font-bold uppercase tracking-wide text-stone-800">
                {trimmed}
              </p>
            );
          }
          if (trimmed === "") {
            return <div key={i} className="h-2" />;
          }
          return (
            <p key={i} className="text-stone-800">
              {line}
            </p>
          );
        })}
      </div>
    </article>
  );
}
