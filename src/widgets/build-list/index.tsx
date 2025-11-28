import { createRoot } from "react-dom/client";
import { BuildList } from "./BuildList";

// Create root element if it doesn't exist (for ChatGPT iframe)
let container = document.getElementById("root");
if (!container) {
  container = document.createElement("div");
  container.id = "root";
  document.body.appendChild(container);
}

const root = createRoot(container);
root.render(<BuildList />);
