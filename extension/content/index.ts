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
  description?: string;
  domain: string;
} {
  const favicon =
    document.querySelector('link[rel="icon"]')?.getAttribute('href') ||
    document.querySelector('link[rel="shortcut icon"]')?.getAttribute('href') ||
    undefined;

  const description =
    document.querySelector('meta[name="description"]')?.getAttribute('content') ||
    document.querySelector('meta[property="og:description"]')?.getAttribute('content') ||
    undefined;

  const url = window.location.href;
  const domain = new URL(url).hostname;

  return {
    title: document.title,
    url,
    favicon,
    description,
    domain,
  };
}

/**
 * Inject "Add to czToDo" button next to selection.
 * Called when text is selected.
 */
function injectCaptureUI(selection: Selection): void {
  // Remove existing UI if present
  const existing = document.getElementById('cztodo-capture-ui');
  if (existing) existing.remove();

  const range = selection.getRangeAt(0);
  const rect = range.getBoundingClientRect();

  const ui = document.createElement('div');
  ui.id = 'cztodo-capture-ui';
  ui.style.cssText = `
    position: fixed;
    top: ${rect.top + window.scrollY - 40}px;
    left: ${rect.left + window.scrollX}px;
    background: #3b82f6;
    color: white;
    padding: 8px 12px;
    border-radius: 4px;
    font-size: 12px;
    cursor: pointer;
    z-index: 10000;
    box-shadow: 0 2px 8px rgba(0,0,0,0.2);
    white-space: nowrap;
  `;
  ui.textContent = '+ Add to czToDo';

  ui.addEventListener('click', async () => {
    try {
      const selectedText = selection.toString();
      const metadata = getPageMetadata();

      await sendToBackground({
        type: 'CAPTURE_TEXT',
        payload: {
          text: selectedText,
          ...metadata,
        },
      });

      ui.textContent = '✓ Added!';
      ui.style.background = '#10b981';

      setTimeout(() => ui.remove(), 2000);
    } catch (err) {
      console.error('Capture failed:', err);
      ui.textContent = '✗ Error';
      ui.style.background = '#ef4444';

      setTimeout(() => ui.remove(), 2000);
    }
  });

  document.body.appendChild(ui);

  // Remove UI when selection changes
  const clearUI = () => {
    ui.remove();
    document.removeEventListener('selectionchange', clearUI);
  };
  document.addEventListener('selectionchange', clearUI);
}

/**
 * Listen for messages from background worker.
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
 * Show capture UI on text selection.
 */
document.addEventListener('selectionchange', () => {
  const selection = window.getSelection();
  if (selection && selection.toString().length > 0) {
    injectCaptureUI(selection);
  }
});

/**
 * Detect GitHub issue or PR URL and extract metadata.
 */
function detectGitHubIssueOrPR(): {
  type: 'issue' | 'pr';
  owner: string;
  repo: string;
  number: number;
} | null {
  const match = window.location.pathname.match(
    /^\/([^\/]+)\/([^\/]+)\/(issues|pull)\/(\d+)/
  );

  if (!match) return null;

  const [, owner, repo, type, number] = match;
  return {
    type: type === 'pull' ? 'pr' : 'issue',
    owner,
    repo,
    number: parseInt(number, 10),
  };
}

/**
 * Inject "Add to czToDo" button for GitHub issues/PRs.
 * Injects into the sidebar near metadata.
 */
function injectGitHubUI(): void {
  const metadata = detectGitHubIssueOrPR();
  if (!metadata) return;

  // Find the sidebar container
  const sidebar = document.querySelector('[data-testid="issue-sidebar"]');
  if (!sidebar) return;

  // Check if we already injected
  if (document.getElementById('cztodo-github-button')) return;

  const button = document.createElement('button');
  button.id = 'cztodo-github-button';
  button.textContent = `+ Add to czToDo`;
  button.style.cssText = `
    display: block;
    width: 100%;
    padding: 8px 12px;
    margin: 8px 0;
    background: #3b82f6;
    color: white;
    border: none;
    border-radius: 6px;
    font-size: 12px;
    cursor: pointer;
    font-weight: 500;
  `;

  button.addEventListener('click', async () => {
    try {
      const title =
        document.querySelector('h1')?.textContent?.trim() ||
        `${metadata.type === 'pr' ? 'PR' : 'Issue'} #${metadata.number}`;

      const description =
        document.querySelector('[data-testid="issue-body"]')?.textContent?.substring(0, 500) ||
        undefined;

      await sendToBackground({
        type: 'ADD_GITHUB',
        payload: {
          title,
          description,
          url: window.location.href,
          github_issue_id: `${metadata.owner}/${metadata.repo}#${metadata.number}`,
          type: metadata.type,
        },
      });

      button.textContent = '✓ Added!';
      button.style.background = '#10b981';
      button.disabled = true;

      setTimeout(() => {
        button.textContent = '+ Add to czToDo';
        button.style.background = '#3b82f6';
        button.disabled = false;
      }, 2000);
    } catch (err) {
      console.error('GitHub capture failed:', err);
      button.textContent = '✗ Error';
      button.style.background = '#ef4444';

      setTimeout(() => {
        button.textContent = '+ Add to czToDo';
        button.style.background = '#3b82f6';
      }, 2000);
    }
  });

  sidebar.insertBefore(button, sidebar.firstChild);
}

/**
 * Monitor for page navigation (SPA support).
 * Re-inject UI on GitHub navigation.
 */
let lastUrl = window.location.href;

const observer = new MutationObserver(() => {
  const currentUrl = window.location.href;
  if (currentUrl !== lastUrl) {
    lastUrl = currentUrl;
    if (isGitHubPage()) {
      // Remove old button
      document.getElementById('cztodo-github-button')?.remove();
      setTimeout(() => injectGitHubUI(), 500);
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

// Initialize
if (isGitHubPage()) {
  setTimeout(() => injectGitHubUI(), 500);
}
