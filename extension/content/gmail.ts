// Gmail integration for czToDo

export function detectGmailMessage(): GmailMessageData | null {
  const url = window.location.href;

  // Only on Gmail domain
  if (!url.includes('mail.google.com')) {
    return null;
  }

  // Check if we're viewing a thread/message
  const threadContainer = document.querySelector('[data-thread-id]');
  if (!threadContainer) {
    return null;
  }

  return {
    url,
    subject: getEmailSubject(),
    from: getEmailFrom(),
    body: getEmailBody(),
    timestamp: new Date().toISOString(),
  };
}

interface GmailMessageData {
  url: string;
  subject: string | null;
  from: string | null;
  body: string | null;
  timestamp: string;
}

function getEmailSubject(): string | null {
  // Gmail subject is in a specific element
  const subjectEl = document.querySelector('[data-thread-subject]');
  if (subjectEl) {
    return subjectEl.textContent?.trim() || null;
  }

  // Fallback to common selectors
  const heading = document.querySelector('h2.hP, [role="heading"]');
  return heading?.textContent?.trim() || null;
}

function getEmailFrom(): string | null {
  // Find sender information
  const fromEl = document.querySelector('[email]');
  if (fromEl) {
    return fromEl.getAttribute('email') || fromEl.textContent?.trim() || null;
  }

  // Alternative selectors
  const senderEl = document.querySelector('[data-sender], .gD');
  return senderEl?.textContent?.trim() || null;
}

function getEmailBody(): string | null {
  // Get the email body content
  const bodyEl = document.querySelector('[data-message-id] [role="main"], [data-message-id] .ii');
  if (bodyEl) {
    return bodyEl.textContent?.trim().substring(0, 500) || null;
  }

  return null;
}

export function injectGmailButton() {
  // Check if button already exists
  if (document.getElementById('cztodo-gmail-btn')) {
    return;
  }

  // Find the toolbar/action area
  const toolbar = document.querySelector('[data-tooltip="Add to Tasks"], .goog-toolbar, [role="toolbar"]');
  if (!toolbar) {
    return;
  }

  const btn = document.createElement('button');
  btn.id = 'cztodo-gmail-btn';
  btn.setAttribute('aria-label', 'Add to czToDo');
  btn.textContent = '📋';
  btn.style.cssText = `
    padding: 8px 12px;
    background-color: transparent;
    color: #5f6368;
    border: none;
    border-radius: 4px;
    font-size: 16px;
    cursor: pointer;
    margin: 0 4px;
    transition: all 0.2s;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  `;

  btn.addEventListener('mouseover', () => {
    btn.style.backgroundColor = '#f1f3f4';
  });

  btn.addEventListener('mouseout', () => {
    btn.style.backgroundColor = 'transparent';
  });

  btn.addEventListener('click', async () => {
    const messageData = detectGmailMessage();
    if (!messageData) {
      alert('Could not read email. Please refresh and try again.');
      return;
    }

    try {
      const response = await chrome.runtime.sendMessage({
        type: 'CAPTURE_EMAIL',
        payload: messageData,
      });

      if (response.success) {
        // Show confirmation
        const originalContent = btn.textContent;
        btn.textContent = '✓';
        btn.style.color = '#34a853';
        setTimeout(() => {
          btn.textContent = originalContent;
          btn.style.color = '#5f6368';
        }, 2000);
      }
    } catch (err) {
      console.error('Failed to add email to czToDo:', err);
      alert('Failed to add email to czToDo');
    }
  });

  // Insert button at the beginning of toolbar
  toolbar.insertBefore(btn, toolbar.firstChild);
}

export function setupGmailIntegration() {
  const messageData = detectGmailMessage();
  if (!messageData) return;

  // Initial injection
  injectGmailButton();

  // Re-inject when email changes (Gmail uses dynamic loading)
  const observer = new MutationObserver(() => {
    if (!document.getElementById('cztodo-gmail-btn')) {
      injectGmailButton();
    }
  });

  observer.observe(document.body, { childList: true, subtree: true });
}
