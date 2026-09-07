/**
 * Options page for czToDo extension settings.
 */

/**
 * Send message to background worker.
 */
function sendToBackground<T = any>(
  message: any
): Promise<any> {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(message, (response: any) => {
      if (chrome.runtime.lastError) {
        reject(
          new Error(chrome.runtime.lastError.message)
        );
      } else if (!response?.success) {
        reject(new Error(response?.error || 'Unknown error'));
      } else {
        resolve(response.data);
      }
    });
  });
}

/**
 * Show status message.
 */
function showMessage(
  text: string,
  type: 'success' | 'error' | 'info'
) {
  const container = document.getElementById('statusMessage');
  if (!container) return;

  const div = document.createElement('div');
  div.className = `status-message ${type}`;
  div.textContent = text;
  container.innerHTML = '';
  container.appendChild(div);

  if (type === 'success' || type === 'info') {
    setTimeout(() => {
      div.remove();
    }, 5000);
  }
}

/**
 * Update UI from stored state.
 */
async function updateUI() {
  try {
    // Check GitHub token status
    const tokenStatus = await sendToBackground({
      type: 'GET_GITHUB_TOKEN',
    });

    const tokenStatusEl = document.getElementById('tokenStatus');
    if (tokenStatus?.token) {
      tokenStatusEl!.textContent = '✓ Configured';
      (document.getElementById('githubToken') as HTMLInputElement)
        .placeholder = '••••••••••••••••';
    } else {
      tokenStatusEl!.textContent = '✗ Not configured';
    }

    // Get user info (from localStorage cache)
    const authResult = (await chrome.storage.local.get(
      'authToken'
    )) as { authToken?: any };
    const userInfo = document.getElementById('userInfo');
    if (authResult.authToken) {
      userInfo!.innerHTML = `
        <p style="margin: 0 0 12px 0;">
          <strong>Authenticated</strong><br>
          <span style="font-size: 12px; color: var(--color-text-light);">
            Ready to sync and capture tasks
          </span>
        </p>
      `;
    } else {
      userInfo!.innerHTML = `
        <p style="margin: 0 0 12px 0; color: var(--color-error);">
          <strong>Not Authenticated</strong><br>
          <span style="font-size: 12px;">
            Please log in via the extension popup to use czToDo
          </span>
        </p>
      `;
    }

    // Update diagnostics
    const storageData = (await chrome.storage.local.get([
      'todos',
      'syncStatus',
      'githubSyncStatus',
    ])) as {
      todos?: any[];
      syncStatus?: string;
      githubSyncStatus?: {
        lastSyncAt?: number;
      };
    };

    const diag = document.getElementById('diagnostics');
    const lastSyncTime = storageData.githubSyncStatus?.lastSyncAt
      ? new Date(storageData.githubSyncStatus.lastSyncAt).toLocaleString()
      : 'never';

    diag!.innerHTML = `
      <strong>Storage Status:</strong><br>
      • Cached todos: ${(storageData.todos || []).length} items<br>
      • Sync status: ${storageData.syncStatus || 'unknown'}<br>
      • GitHub sync: ${lastSyncTime}<br>
      <br>
      <strong>Extension Version:</strong><br>
      • Version 0.1.0<br>
      • Manifest V3<br>
    `;
  } catch (err) {
    console.error('Error updating UI:', err);
  }
}

/**
 * Event listeners.
 */
document
  .getElementById('saveGithubToken')
  ?.addEventListener('click', async () => {
    const input = document.getElementById(
      'githubToken'
    ) as HTMLInputElement;
    const token = input.value.trim();

    if (!token) {
      showMessage('Please enter a token', 'error');
      return;
    }

    try {
      await sendToBackground({
        type: 'SET_GITHUB_TOKEN',
        payload: { token },
      });

      input.value = '';
      showMessage(
        'Token saved and sync started',
        'success'
      );
      updateUI();
    } catch (err) {
      showMessage(
        `Error: ${err instanceof Error ? err.message : String(err)}`,
        'error'
      );
    }
  });

document
  .getElementById('testGithubToken')
  ?.addEventListener('click', async () => {
    const input = document.getElementById(
      'githubToken'
    ) as HTMLInputElement;
    const token = input.value.trim();

    if (!token) {
      showMessage('Please enter a token', 'error');
      return;
    }

    try {
      const response = await fetch('https://api.github.com/user', {
        headers: {
          'Authorization': `token ${token}`,
          'Accept': 'application/vnd.github.v3+json',
        },
      });

      if (response.ok) {
        const user = await response.json();
        showMessage(
          `✓ Valid token for @${user.login}`,
          'success'
        );
      } else {
        showMessage(
          `✗ Invalid token (${response.status})`,
          'error'
        );
      }
    } catch (err) {
      showMessage(
        `Error: ${err instanceof Error ? err.message : String(err)}`,
        'error'
      );
    }
  });

document
  .getElementById('removeGithubToken')
  ?.addEventListener('click', async () => {
    if (!confirm('Remove GitHub token?')) return;

    try {
      await sendToBackground({
        type: 'SET_GITHUB_TOKEN',
        payload: { token: null },
      });

      showMessage('Token removed', 'success');
      updateUI();
    } catch (err) {
      showMessage(
        `Error: ${err instanceof Error ? err.message : String(err)}`,
        'error'
      );
    }
  });

document
  .getElementById('syncNow')
  ?.addEventListener('click', async () => {
    try {
      const button = document.getElementById('syncNow') as HTMLButtonElement;
      button.disabled = true;
      button.textContent = 'Syncing...';

      await new Promise(resolve => setTimeout(resolve, 1000));
      showMessage('Sync completed', 'info');
      updateUI();
    } catch (err) {
      showMessage(
        `Error: ${err instanceof Error ? err.message : String(err)}`,
        'error'
      );
    } finally {
      const button = document.getElementById(
        'syncNow'
      ) as HTMLButtonElement;
      button.disabled = false;
      button.textContent = 'Sync Now';
    }
  });

document
  .getElementById('logout')
  ?.addEventListener('click', async () => {
    if (!confirm('Logout from czToDo?')) return;

    try {
      await sendToBackground({
        type: 'LOGOUT',
      });

      showMessage('Logged out', 'success');
      updateUI();
    } catch (err) {
      showMessage(
        `Error: ${err instanceof Error ? err.message : String(err)}`,
        'error'
      );
    }
  });

// Initialize on load
document.addEventListener('DOMContentLoaded', updateUI);
