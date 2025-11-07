import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { startBackgroundMusic } from "./lib/sound.ts";

function tryStartBgm() {
    try {
        startBackgroundMusic();
    } catch {
        // swallow errors
    }
}
// try once on load
tryStartBgm();

// fallback: start on first user gesture if autoplay was blocked
const onFirstGesture = () => {
  tryStartBgm();
  window.removeEventListener("click", onFirstGesture);
  window.removeEventListener("touchstart", onFirstGesture);
};
window.addEventListener("click", onFirstGesture);
window.addEventListener("touchstart", onFirstGesture);

createRoot(document.getElementById("root")!).render(<App />);
