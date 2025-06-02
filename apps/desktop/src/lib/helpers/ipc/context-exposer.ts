import { exposeAuthContext } from "./auth/auth-context";
import { exposeThemeContext } from "./theme/theme-context";
import { exposeWindowContext } from "./window/window-context";
import { exposeSystemAudioContext } from "./system-audio/system-audio-context";
import { exposeAECAudioContext } from "./aec-audio/aec-audio-context";
import { exposeUpdateContext } from "./update/update-context";

export default function exposeContexts() {
  exposeWindowContext();
  exposeThemeContext();
  exposeAuthContext();
  exposeSystemAudioContext();
  exposeAECAudioContext();
  exposeUpdateContext();
}
