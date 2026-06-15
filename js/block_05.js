/* ═══════════════════════════════════════════════════════════════
   PREMIUM CODE PANEL — Global Tab Switcher & AI Chat Functions
   (must be global for onclick= attributes to work)
═══════════════════════════════════════════════════════════════ */

function switchCPTab(tab) {
  document.querySelectorAll('.cp-tab').forEach(function (btn) {
    btn.classList.toggle('active', btn.id === 'tab-' + tab);
  });
  document.querySelectorAll('.cp-pane').forEach(function (pane) {
    pane.classList.toggle('active', pane.id === 'pane-' + tab);
  });
  if (tab === 'terminal') {
    var rd = document.getElementById('responseDisplay');
    if (rd) setTimeout(function () { rd.scrollTop = rd.scrollHeight; }, 50);
  }
}

function cyclePanelView() {
  var btn = document.getElementById('panelToggleBtn');
  var panel = document.getElementById('codePanel');
  if (!panel) return;
  var states = ['split', 'code-only', 'terminal-only'];
  var current = panel.dataset.viewState || 'split';
  var next = states[(states.indexOf(current) + 1) % states.length];
  panel.dataset.viewState = next;
  if (btn) {
    var labels = {
      'split': '<i class="fa-solid fa-table-columns" style="font-size:8px"></i> Split',
      'code-only': '<i class="fa-solid fa-code" style="font-size:8px"></i> Code',
      'terminal-only': '<i class="fa-solid fa-terminal" style="font-size:8px"></i> Term'
    };
    btn.innerHTML = labels[next] || labels['split'];
  }
}

function rdClear() {
  var rd = document.getElementById('responseDisplay');
  if (rd) rd.innerHTML = '';
}

function cpAiAppendMessage(role, text) {
  var messages = document.getElementById('cpAiMessages');
  if (!messages) return;
  var div = document.createElement('div');
  if (role === 'bot') {
    div.className = 'ai-msg-bot';
    div.innerHTML = '<div class="ai-msg-avatar"><i class="fa-solid fa-robot"></i></div>' +
      '<div class="ai-msg-bubble">' + text + '</div>';
  } else {
    div.className = 'ai-msg-user';
    div.innerHTML = '<div class="ai-msg-user-bubble">' + text + '</div>';
  }
  messages.appendChild(div);
  messages.scrollTop = messages.scrollHeight;
}

function cpAiShowTyping() {
  var messages = document.getElementById('cpAiMessages');
  if (!messages) return null;
  var div = document.createElement('div');
  div.className = 'ai-typing';
  div.id = 'cpAiTyping';
  div.innerHTML = '<div class="ai-msg-avatar"><i class="fa-solid fa-robot"></i></div>' +
    '<div class="ai-typing-dots"><span></span><span></span><span></span></div>';
  messages.appendChild(div);
  messages.scrollTop = messages.scrollHeight;
  return div;
}

function cpAiSend() {
  var input = document.getElementById('cpAiInputField');
  if (!input) return;
  var text = (input.value || '').trim();
  if (!text) return;
  input.value = '';
  cpAiQuickSend(text);
}

function cpAiQuickSend(text) {
  cpAiAppendMessage('user', text);
  var chips = document.getElementById('cpAiChips');
  if (chips) chips.style.display = 'none';
  var typing = cpAiShowTyping();
  var code = '';
  try {
    var pyOut = document.getElementById('pyOut');
    if (pyOut) code = pyOut.textContent || '';
  } catch (e) { }
  setTimeout(function () {
    if (typing && typing.parentNode) typing.parentNode.removeChild(typing);
    var reply = cpAiBuildReply(text, code);
    cpAiAppendMessage('bot', reply);
  }, 900 + Math.random() * 600);
}

function cpAiBuildReply(q, code) {
  q = q.toLowerCase();
  if (q.indexOf('explain') !== -1 || q.indexOf('what does') !== -1) {
    if (!code || code.trim().length < 5)
      return 'No code yet! Try dragging some blocks onto the workspace and I\'ll explain what they do.';
    var lines = code.split('\n').filter(function (l) { return l.trim(); }).length;
    return 'Your code has <strong>' + lines + ' active line(s)</strong> of Python. It defines an async start routine that runs on the board. Each block you place generates a specific hardware command — want me to walk through each line?';
  }
  if (q.indexOf('error') !== -1 || q.indexOf('fix') !== -1) {
    return 'Check that all your blocks are properly connected (no floating blocks). Also make sure every sensor block has a valid port selected. Want me to look at the current code?';
  }
  if (q.indexOf('if') !== -1 || q.indexOf('false') !== -1 || q.indexOf('condition') !== -1) {
    return 'The <code>if False:</code> condition never runs, so the body is skipped. Replace <strong>False</strong> with an actual sensor reading like <code>await async_accelerometer()</code> to make it respond to real data.';
  }
  if (q.indexOf('terminal') !== -1 || q.indexOf('output') !== -1) {
    return 'Switch to the <strong>Terminal</strong> tab to see live output from your board. Make sure you\'re connected via USB or BLE first!';
  }
  if (q.indexOf('loop') !== -1) {
    return 'Use the <strong>Loop</strong> category in the toolbox to add infinite or counted loops. Loops let your code run repeatedly on the board.';
  }
  return 'Great question! I\'m here to help you understand your Blockly code. Try asking me to <em>explain this code</em>, <em>fix an error</em>, or about any specific block in your workspace.';
}

function cpAiClearChat() {
  var messages = document.getElementById('cpAiMessages');
  if (!messages) return;
  messages.innerHTML = '<div class="ai-msg-bot"><div class="ai-msg-avatar"><i class="fa-solid fa-robot"></i></div><div class="ai-msg-bubble">Hi! I\'m Curio, your coding buddy. Ask me about your blocks, the code, or anything in the terminal — I\'ll explain it the easy way.</div></div>';
  var chips = document.getElementById('cpAiChips');
  if (chips) chips.style.display = 'flex';
}
