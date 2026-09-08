// Slack integration for czToDo

export function detectSlackMessage(): SlackMessageData | null {
  const url = window.location.href;

  // Only on Slack domain
  if (!url.includes('slack.com')) {
    return null;
  }

  // Get message content
  const messageElement = document.querySelector('[data-qa-type="message"]');
  if (!messageElement) {
    return null;
  }

  return {
    url,
    channel: getSlackChannel(),
    messageText: getSlackMessageText(messageElement),
    author: getSlackAuthor(messageElement),
    timestamp: new Date().toISOString(),
  };
}

interface SlackMessageData {
  url: string;
  channel: string | null;
  messageText: string | null;
  author: string | null;
  timestamp: string;
}

function getSlackChannel(): string | null {
  // Get channel name from header or breadcrumb
  const channelEl = document.querySelector('[data-qa="channel_name"], .p-channel_topic_text');
  if (channelEl) {
    return channelEl.textContent?.trim() || null;
  }

  // Try to extract from URL
  const match = window.location.href.match(/archives\/([A-Z0-9]+)/);
  return match ? match[1] : null;
}

function getSlackMessageText(messageElement: Element): string | null {
  const textEl = messageElement.querySelector('[data-qa-type="rich_text_section"], .c-message__body');
  if (textEl) {
    return textEl.textContent?.trim() || null;
  }

  return messageElement.textContent?.trim() || null;
}

function getSlackAuthor(messageElement: Element): string | null {
  const authorEl = messageElement.querySelector('[data-qa="message_sender_name"], .c-message__sender_name');
  if (authorEl) {
    return authorEl.textContent?.trim() || null;
  }

  return null;
}

export function injectSlackButton() {
  // Check if button already exists
  if (document.getElementById('cztodo-slack-btn')) {
    return;
  }

  // Find message actions menu
  const messageContainer = document.querySelector('[data-qa-type="message"]');
  if (!messageContainer) {
    return;
  }

  const actionsMenu = messageContainer.querySelector('[data-qa="message_actions"]');
  if (!actionsMenu) {
    return;
  }

  const btn = document.createElement('button');
  btn.id = 'cztodo-slack-btn';
  btn.setAttribute('aria-label', 'Add to czToDo');
  btn.style.cssText = `
    padding: 4px 8px;
    background-color: transparent;
    color: #0a0e27;
    border: none;
    border-radius: 4px;
    font-size: 14px;
    cursor: pointer;
    margin: 0 2px;
    transition: all 0.2s;
  `;
  btn.innerHTML = '📋 Add to czToDo';

  btn.addEventListener('mouseover', () => {
    btn.style.backgroundColor = '#f2f2f2';
  });

  btn.addEventListener('mouseout', () => {
    btn.style.backgroundColor = 'transparent';
  });

  btn.addEventListener('click', async () => {
    const messageData = detectSlackMessage();
    if (!messageData) {
      alert('Could not read message. Please try again.');
      return;
    }

    try {
      const response = await chrome.runtime.sendMessage({
        type: 'CAPTURE_SLACK_MESSAGE',
        payload: messageData,
      });

      if (response.success) {
        // Show confirmation
        const originalContent = btn.innerHTML;
        btn.innerHTML = '✓ Added';
        btn.style.color = '#2c2d30';
        setTimeout(() => {
          btn.innerHTML = originalContent;
        }, 2000);
      }
    } catch (err) {
      console.error('Failed to add Slack message to czToDo:', err);
      alert('Failed to add message to czToDo');
    }
  });

  // Insert button into actions menu
  actionsMenu.appendChild(btn);
}

export function setupSlackIntegration() {
  const messageData = detectSlackMessage();
  if (!messageData) return;

  // Initial injection
  injectSlackButton();

  // Re-inject when messages change (Slack uses dynamic loading)
  const observer = new MutationObserver(() => {
    if (!document.getElementById('cztodo-slack-btn')) {
      injectSlackButton();
    }
  });

  observer.observe(document.body, { childList: true, subtree: true });
}

// Setup context menu for Slack messages
export function setupSlackContextMenu() {
  document.addEventListener('contextmenu', (e) => {
    const target = e.target as HTMLElement;
    const messageElement = target.closest('[data-qa-type="message"]');

    if (messageElement) {
      const messageData = detectSlackMessage();
      if (messageData) {
        // Context menu will be handled by background worker
        chrome.runtime.sendMessage({
          type: 'SLACK_CONTEXT_MENU',
          payload: messageData,
        }).catch(err => console.error('Failed to send Slack context menu:', err));
      }
    }
  });
}
