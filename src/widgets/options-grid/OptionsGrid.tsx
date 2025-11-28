import { useEffect, useState } from "react";
import type { CustomizationOptions, Color } from "../shared/types";

// Color hex values for swatches
const COLOR_HEX_MAP: Record<Color, string> = {
  red: "#FF0000",
  blue: "#0000FF",
  green: "#00FF00",
  yellow: "#FFFF00",
  orange: "#FFA500",
  purple: "#800080",
  pink: "#FFC0CB",
  black: "#000000",
  white: "#FFFFFF",
  silver: "#C0C0C0",
  gold: "#FFD700",
  cyan: "#00FFFF",
  magenta: "#FF00FF",
  lime: "#00FF00",
};

interface OptionSectionProps {
  title: string;
  items: string[];
  renderItem?: (item: string) => React.ReactNode;
}

function OptionSection({ title, items, renderItem }: OptionSectionProps) {
  return (
    <div style={{ marginBottom: "24px" }}>
      <h3
        style={{
          marginTop: 0,
          marginBottom: "12px",
          fontSize: "18px",
          fontWeight: "600",
          color: "#1a1a1a",
        }}
      >
        {title}
      </h3>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "8px",
        }}
      >
        {items.map((item) => (
          <div
            key={item}
            style={{
              padding: "6px 12px",
              backgroundColor: "#f5f5f5",
              borderRadius: "16px",
              fontSize: "14px",
              fontWeight: "500",
              color: "#333",
              border: "1px solid #ddd",
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            {renderItem ? renderItem(item) : item}
          </div>
        ))}
      </div>
    </div>
  );
}

function ColorSwatch({ color }: { color: Color }) {
  const hexColor = COLOR_HEX_MAP[color];
  return (
    <div
      style={{
        width: "16px",
        height: "16px",
        borderRadius: "50%",
        backgroundColor: hexColor,
        border: color === "white" ? "1px solid #ddd" : "none",
        flexShrink: 0,
      }}
    />
  );
}

function formatLabel(value: string): string {
  return value
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function OptionsGrid() {
  const [options, setOptions] = useState<CustomizationOptions | null>(null);

  useEffect(() => {
    const content = window.openai?.structuredContent as CustomizationOptions;
    if (content) {
      setOptions(content);
    }
  }, []);

  if (!options) {
    return (
      <div
        style={{
          border: "3px solid red",
          padding: "16px",
          borderRadius: "8px",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        Loading...
      </div>
    );
  }

  return (
    <div
      style={{
        border: "3px solid red",
        padding: "16px",
        borderRadius: "8px",
        fontFamily: "system-ui, sans-serif",
        maxWidth: "1200px",
        margin: "0 auto",
      }}
    >
      <h2
        style={{
          marginTop: 0,
          marginBottom: "24px",
          fontSize: "24px",
          fontWeight: "700",
          color: "#1a1a1a",
        }}
      >
        Customization Options
      </h2>

      {/* Colors section with color swatches */}
      <OptionSection
        title="Colors"
        items={options.colors}
        renderItem={(color) => (
          <>
            <ColorSwatch color={color as Color} />
            <span>{formatLabel(color)}</span>
          </>
        )}
      />

      {/* Wheels section */}
      <OptionSection
        title="Wheels"
        items={options.wheels.map(formatLabel)}
      />

      {/* Body Kits section */}
      <OptionSection
        title="Body Kits"
        items={options.bodyKits.map(formatLabel)}
      />

      {/* Decals section */}
      <OptionSection
        title="Decals"
        items={options.decals.map(formatLabel)}
      />

      {/* Spoilers section */}
      <OptionSection
        title="Spoilers"
        items={options.spoilers.map(formatLabel)}
      />

      {/* Exhausts section */}
      <OptionSection
        title="Exhausts"
        items={options.exhausts.map(formatLabel)}
      />

      {/* Underglows section */}
      <OptionSection
        title="Underglows"
        items={options.underglows.map(formatLabel)}
      />

      {/* Driver Personas section */}
      <OptionSection
        title="Driver Personas"
        items={options.driverPersonas.map(formatLabel)}
      />
    </div>
  );
}
