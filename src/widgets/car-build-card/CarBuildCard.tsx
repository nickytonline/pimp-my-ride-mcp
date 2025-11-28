import { useEffect, useState } from "react";
import type { Build } from "../shared/types";

export function CarBuildCard() {
  const [build, setBuild] = useState<Build | null>(null);

  useEffect(() => {
    const data = window.openai?.structuredContent as Build;
    if (data) {
      setBuild(data);
    }
  }, []);

  if (!build) {
    return (
      <div style={{
        padding: "16px",
        fontFamily: "system-ui, sans-serif",
        color: "#666"
      }}>
        Loading...
      </div>
    );
  }

  const { car, driver, name } = build;
  const { performance } = car;

  // Format label for display
  const formatLabel = (value: string): string => {
    return value
      .split("_")
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  // Performance bar component
  const PerformanceBar = ({ label, value }: { label: string; value: number }) => (
    <div style={{ marginBottom: "12px" }}>
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        marginBottom: "4px",
        fontSize: "14px",
        color: "#333"
      }}>
        <span>{label}</span>
        <span style={{ fontWeight: "bold" }}>{value}</span>
      </div>
      <div style={{
        width: "100%",
        height: "8px",
        backgroundColor: "#e0e0e0",
        borderRadius: "4px",
        overflow: "hidden"
      }}>
        <div style={{
          width: `${value}%`,
          height: "100%",
          backgroundColor: value >= 75 ? "#22c55e" : value >= 50 ? "#3b82f6" : value >= 25 ? "#f59e0b" : "#ef4444",
          transition: "width 0.3s ease"
        }} />
      </div>
    </div>
  );

  // Config row component
  const ConfigRow = ({ label, value }: { label: string; value: string | undefined }) => (
    <div style={{
      display: "flex",
      justifyContent: "space-between",
      padding: "8px 0",
      borderBottom: "1px solid #f0f0f0"
    }}>
      <span style={{ color: "#666", fontSize: "14px" }}>{label}</span>
      <span style={{ fontWeight: "500", fontSize: "14px" }}>{formatLabel(value || "none")}</span>
    </div>
  );

  return (
    <div style={{
      border: "3px solid red",
      padding: "16px",
      borderRadius: "8px",
      fontFamily: "system-ui, sans-serif",
      maxWidth: "600px",
      backgroundColor: "#ffffff"
    }}>
      {/* Header with build name */}
      <div style={{
        marginBottom: "24px",
        paddingBottom: "16px",
        borderBottom: "2px solid #e0e0e0"
      }}>
        <h2 style={{
          margin: "0 0 8px 0",
          fontSize: "24px",
          fontWeight: "bold",
          color: "#111"
        }}>
          {name || "Unnamed Build"}
        </h2>
        <div style={{ fontSize: "12px", color: "#999" }}>
          Build ID: {build.id}
        </div>
      </div>

      {/* Car Configuration Section */}
      <div style={{ marginBottom: "24px" }}>
        <h3 style={{
          margin: "0 0 12px 0",
          fontSize: "18px",
          fontWeight: "bold",
          color: "#111"
        }}>
          Car Configuration
        </h3>
        <div style={{ backgroundColor: "#fafafa", padding: "12px", borderRadius: "6px" }}>
          <ConfigRow label="Color" value={car.color} />
          <ConfigRow label="Secondary Color" value={car.secondaryColor} />
          <ConfigRow label="Wheels" value={car.wheels} />
          <ConfigRow label="Body Kit" value={car.bodyKit} />
          <ConfigRow label="Decal" value={car.decal} />
          <ConfigRow label="Spoiler" value={car.spoiler} />
          <ConfigRow label="Exhaust" value={car.exhaust} />
          <ConfigRow label="Underglow" value={car.underglow} />
        </div>
      </div>

      {/* Performance Section */}
      <div style={{ marginBottom: "24px" }}>
        <h3 style={{
          margin: "0 0 12px 0",
          fontSize: "18px",
          fontWeight: "bold",
          color: "#111"
        }}>
          Performance Stats
        </h3>
        <div style={{ backgroundColor: "#fafafa", padding: "12px", borderRadius: "6px" }}>
          <PerformanceBar label="Power" value={performance.power} />
          <PerformanceBar label="Grip" value={performance.grip} />
          <PerformanceBar label="Aero" value={performance.aero} />
          <PerformanceBar label="Weight" value={performance.weight} />
        </div>
      </div>

      {/* Driver Section */}
      <div>
        <h3 style={{
          margin: "0 0 12px 0",
          fontSize: "18px",
          fontWeight: "bold",
          color: "#111"
        }}>
          Driver Profile
        </h3>
        <div style={{
          backgroundColor: "#fafafa",
          padding: "16px",
          borderRadius: "6px",
          display: "flex",
          flexDirection: "column",
          gap: "8px"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{
              fontSize: "24px",
              padding: "8px",
              backgroundColor: "#fff",
              borderRadius: "4px"
            }}>
              🏎️
            </span>
            <div>
              <div style={{ fontWeight: "bold", fontSize: "16px", color: "#111" }}>
                {driver.nickname || "Anonymous Driver"}
              </div>
              <div style={{ fontSize: "14px", color: "#666" }}>
                {formatLabel(driver.persona)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
