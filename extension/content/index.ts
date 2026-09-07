/**
 * Chrome extension content script.
 * Lightweight vanilla TypeScript.
 * Never receives authentication tokens; routes authenticated operations through messages.
 */

import type { Message, MessageResponse } from '../lib/messages';

/**
 * Send a message to the background service worker.
 */
function sendToBackground<T>(
  message: Message
): Promise<T> {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(
      message,
      (response: MessageResponse<T>) => {
        if (chrome.runtime.lastError) {
          reject(
            new Error(chrome.runtime.lastError.message)
          );
        } else if (!response.success) {
          reject(new Error(response.error || 'Unknown error'));
        } else {
          resolve(response.data as T);
        }
      }
    );
  });
}

/**
 * Capture selected text from the page.
 */
function captureSelectedText(): string {
  const selection = window.getSelection();
  return selection ? selection.toString() : '';
}

/**
 * Get current page metadata.
 */
function getPageMetadata(): {
  title: string;
  url: string;
  favicon?: string;
} {
  const favicon =
    document.querySelector('link[rel="icon"]')?.getAttribute('href') ||
    document.querySelector('link[rel="shortcut icon"]')?.getAttribute('href') ||
    undefined;

  return {
    title: document.title,
    url: window.location.href,
    favicon,
  };
}

/**
 * Listen for context menu clicks.
 */
chrome.runtime.onMessage.addListener(
  (
    message: Message,
    sender: chrome.runtime.MessageSender,
    sendResponse: (response: MessageResponse) => void
  ) => {
    if (message.type === 'CAPTURE_TEXT') {
      const selectedText = captureSelectedText();
      const metadata = getPageMetadata();

      sendResponse({
        success: true,
        data: {
          text: selectedText,
          ...metadata,
        },
      });
    }
  }
);

/**
 * Monitor for page navigation (SPA support).
 * Inject "Add to czToDo" UI on GitHub pages when they load.
 */
let lastUrl = window.location.href;

const observer = new MutationObserver(() => {
  const currentUrl = window.location.href;
  if (currentUrl !== lastUrl) {
    lastUrl = currentUrl;
    // Re-inject UI on navigation
    if (isGitHubPage()) {
      injectGitHubUI();
    }
  }
});

observer.observe(document.documentElement, {
  subtree: true,
  childList: true,
});

function isGitHubPage(): boolean {
  return window.location.hostname.includes('github.com');
}

function injectGitHubUI(): void {
  // TODO: Implement GitHub issue/PR detection and injection
  // This is a placeholder for Task 15 implementation
}

// Initialize
if (isGitHubPage()) {
  injectGitHubUI();
}
