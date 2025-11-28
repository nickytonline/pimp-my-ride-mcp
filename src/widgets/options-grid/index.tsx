import { createRoot } from "react-dom/client";
import { OptionsGrid } from "./OptionsGrid";

const container = document.getElementById("root");
if (container) {
  const root = createRoot(container);
  root.render(<OptionsGrid />);
}
