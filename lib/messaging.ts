import { ChildMessage } from "../types";

export const postToParent = (message: ChildMessage) => {
  if (window.parent && window.parent !== window) {
    // In production, targetOrigin should be strict (e.g., the parent app domain)
    // For this portable component, we use "*"
    window.parent.postMessage(message, "*");
  } else {
    //console.log("[Dev:Standalone] Message emitted:", message);
  }
};
