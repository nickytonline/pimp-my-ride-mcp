import { createRoot } from "react-dom/client";
import { BuildList } from "./BuildList";

const container = document.getElementById("root");
if (container) {
  const root = createRoot(container);
  root.render(<BuildList />);
}
