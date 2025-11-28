import { useEffect, useState } from "react";
import type { BuildListResult } from "../shared/types";

export function BuildList() {
  const [data, setData] = useState<BuildListResult | null>(null);

  useEffect(() => {
    const content = window.openai?.structuredContent as BuildListResult;
    if (content) {
      setData(content);
    }
  }, []);

  if (!data) {
    return <div>Loading...</div>;
  }

  return (
    <div
      style={{
        border: "3px solid red",
        padding: "16px",
        borderRadius: "8px",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <h2 style={{ margin: "0 0 16px 0" }}>
        Saved Builds ({data.builds.length})
      </h2>

      {data.builds.length === 0 ? (
        <p style={{ color: "#666", fontStyle: "italic" }}>
          No saved builds found.
        </p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {data.builds.map((build) => (
            <li
              key={build.id}
              style={{
                padding: "12px",
                marginBottom: "12px",
                border: "1px solid #ddd",
                borderRadius: "4px",
                backgroundColor: "#f9f9f9",
              }}
            >
              <div
                style={{
                  fontWeight: "bold",
                  fontSize: "16px",
                  marginBottom: "4px",
                }}
              >
                {build.name || "Unnamed Build"}
              </div>
              <div style={{ fontSize: "12px", color: "#666" }}>
                <div>ID: {build.id}</div>
                <div>
                  Created: {new Date(build.createdAt).toLocaleString()}
                </div>
                <div>
                  Updated: {new Date(build.updatedAt).toLocaleString()}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {data.hasMore && (
        <div
          style={{
            marginTop: "16px",
            padding: "8px",
            backgroundColor: "#fff3cd",
            border: "1px solid #ffc107",
            borderRadius: "4px",
            fontSize: "14px",
          }}
        >
          <strong>More builds available.</strong>
          {data.cursor && ` Use cursor: ${data.cursor}`}
        </div>
      )}
    </div>
  );
}
