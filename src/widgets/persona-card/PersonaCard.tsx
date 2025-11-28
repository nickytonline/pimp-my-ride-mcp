import { useEffect, useState } from "react";
import type { PersonaPerk, DriverPersona } from "../shared/types";

type SinglePersona = { persona: DriverPersona } & PersonaPerk;
type AllPersonas = Record<DriverPersona, PersonaPerk>;

export function PersonaCard() {
  const [data, setData] = useState<SinglePersona | AllPersonas | null>(null);

  useEffect(() => {
    const content = window.openai?.structuredContent;
    if (content) {
      setData(content as SinglePersona | AllPersonas);
    }
  }, []);

  if (!data) {
    return (
      <div style={{
        border: "3px solid red",
        padding: "16px",
        borderRadius: "8px",
        fontFamily: "system-ui, sans-serif"
      }}>
        Loading persona data...
      </div>
    );
  }

  // Check if it's a single persona or all personas
  const isSingle = "persona" in data;

  return (
    <div style={{
      border: "3px solid red",
      padding: "16px",
      borderRadius: "8px",
      fontFamily: "system-ui, sans-serif"
    }}>
      {isSingle ? renderSinglePersona(data as SinglePersona) : renderAllPersonas(data as AllPersonas)}
    </div>
  );
}

function renderSinglePersona(data: SinglePersona) {
  return (
    <div>
      <h2 style={{ margin: "0 0 16px 0", fontSize: "24px", fontWeight: "bold" }}>
        {formatPersonaName(data.persona)}
      </h2>
      <PersonaDetails
        description={data.description}
        strengths={data.strengths}
        weaknesses={data.weaknesses}
      />
    </div>
  );
}

function renderAllPersonas(data: AllPersonas) {
  const personas = Object.entries(data) as [DriverPersona, PersonaPerk][];

  return (
    <div>
      <h1 style={{ margin: "0 0 24px 0", fontSize: "28px", fontWeight: "bold" }}>
        Driver Personas
      </h1>
      <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
        {personas.map(([personaName, perk]) => (
          <div key={personaName} style={{
            borderTop: "2px solid #ddd",
            paddingTop: "16px"
          }}>
            <h3 style={{ margin: "0 0 12px 0", fontSize: "20px", fontWeight: "bold" }}>
              {formatPersonaName(personaName)}
            </h3>
            <PersonaDetails
              description={perk.description}
              strengths={perk.strengths}
              weaknesses={perk.weaknesses}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

interface PersonaDetailsProps {
  description: string;
  strengths: string[];
  weaknesses: string[];
}

function PersonaDetails({ description, strengths, weaknesses }: PersonaDetailsProps) {
  return (
    <div>
      <p style={{ margin: "0 0 16px 0", lineHeight: "1.5" }}>
        {description}
      </p>

      {strengths.length > 0 && (
        <div style={{ marginBottom: "12px" }}>
          <h4 style={{
            margin: "0 0 8px 0",
            fontSize: "16px",
            fontWeight: "600",
            color: "#2d5f2e"
          }}>
            Strengths
          </h4>
          <ul style={{
            margin: 0,
            paddingLeft: "20px",
            color: "#3d8b40"
          }}>
            {strengths.map((strength, index) => (
              <li key={index} style={{ marginBottom: "4px" }}>
                {strength}
              </li>
            ))}
          </ul>
        </div>
      )}

      {weaknesses.length > 0 && (
        <div>
          <h4 style={{
            margin: "0 0 8px 0",
            fontSize: "16px",
            fontWeight: "600",
            color: "#7f1d1d"
          }}>
            Weaknesses
          </h4>
          <ul style={{
            margin: 0,
            paddingLeft: "20px",
            color: "#b91c1c"
          }}>
            {weaknesses.map((weakness, index) => (
              <li key={index} style={{ marginBottom: "4px" }}>
                {weakness}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function formatPersonaName(persona: DriverPersona): string {
  // Convert CamelCase to Title Case with spaces
  return persona.replace(/([A-Z])/g, " $1").trim();
}
