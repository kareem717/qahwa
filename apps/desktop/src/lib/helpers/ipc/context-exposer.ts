import { exposeAuthContext } from "./auth/auth-context";
import { exposeThemeContext } from "./theme/theme-context";
import { exposeWindowContext } from "./window/window-context";
import { exposeSystemAudioContext } from "./system-audio/system-audio-context";

export default function exposeContexts() {
  exposeWindowContext();
  exposeThemeContext();
  exposeAuthContext();
  exposeSystemAudioContext();
}
