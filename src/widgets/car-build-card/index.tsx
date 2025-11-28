import { createRoot } from "react-dom/client";
import { CarBuildCard } from "./CarBuildCard";

const container = document.getElementById("root");
if (container) {
  const root = createRoot(container);
  root.render(<CarBuildCard />);
}
