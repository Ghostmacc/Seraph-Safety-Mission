/**
 * Seraph Chat Widget — connects to OpenClaw gateway
 *
 * Drop into any page:
 * <script src="/widget/seraph-widget.js"></script>
 */
(function () {
  var GATEWAY = 'wss://seraph.seraphsafe.org';
  var TOKEN = '9e871d10aafd0421f0c48af12279ee251a1048dee01fe7ee';
  var AGENT = 'seraph-v2';

  // ── Styles ──
  var style = document.createElement('style');
  style.textContent = '#seraph-bubble{position:fixed;bottom:24px;right:24px;z-index:99999;width:64px;height:64px;border-radius:50%;background:#1F4E78;color:#fff;border:none;cursor:pointer;font-size:28px;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 20px rgba(0,0,0,0.15);transition:transform 0.2s}#seraph-bubble:hover{transform:scale(1.1)}#seraph-panel{position:fixed;bottom:100px;right:24px;z-index:99999;width:380px;max-height:520px;border-radius:16px;background:#fff;border:1px solid #e5e9f0;box-shadow:0 12px 40px rgba(0,0,0,0.12);display:none;flex-direction:column;overflow:hidden;font-family:system-ui,-apple-system,"Segoe UI",sans-serif}#seraph-panel.open{display:flex}#seraph-header{background:#1F4E78;color:#fff;padding:16px;display:flex;align-items:center;gap:10px}#seraph-header .name{font-weight:700;font-size:1.1rem}#seraph-header .sub{font-size:0.8rem;opacity:0.8}#seraph-close{margin-left:auto;background:none;border:none;color:#fff;font-size:1.4rem;cursor:pointer;opacity:0.7}#seraph-close:hover{opacity:1}#seraph-messages{flex:1;overflow-y:auto;padding:16px;display:flex;flex-direction:column;gap:10px;max-height:340px}.seraph-msg{max-width:85%;padding:10px 14px;border-radius:14px;font-size:0.92rem;line-height:1.45;word-wrap:break-word}.seraph-msg.bot{background:#f6f8fb;color:#1b1f23;align-self:flex-start;border-bottom-left-radius:4px}.seraph-msg.user{background:#1F4E78;color:#fff;align-self:flex-end;border-bottom-right-radius:4px}.seraph-msg.typing{background:#f6f8fb;color:#999;font-style:italic;align-self:flex-start;border-bottom-left-radius:4px}.seraph-actions{display:flex;flex-wrap:wrap;gap:6px;margin-top:6px}.seraph-action-btn{padding:6px 12px;border-radius:999px;border:1px solid #e5e9f0;background:#fff;color:#1F4E78;font-weight:600;font-size:0.8rem;cursor:pointer}.seraph-action-btn:hover{background:#f6f8fb}#seraph-input-row{display:flex;gap:8px;padding:12px;border-top:1px solid #e5e9f0}#seraph-input{flex:1;padding:10px 12px;border:1px solid #e5e9f0;border-radius:12px;font-size:0.92rem;outline:none}#seraph-input:focus{border-color:#1F4E78}#seraph-send{padding:10px 16px;border:none;border-radius:12px;background:#1F4E78;color:#fff;font-weight:700;cursor:pointer;font-size:0.92rem}#seraph-send:hover{filter:brightness(1.1)}@media(max-width:480px){#seraph-panel{width:calc(100vw - 24px);right:12px;bottom:80px;max-height:70vh}}';
  document.head.appendChild(style);

  // ── Build DOM ──
  var bubble = document.createElement('button');
  bubble.id = 'seraph-bubble';
  bubble.textContent = '\uD83D\uDCAC';
  bubble.setAttribute('aria-label', 'Chat with Seraph');

  var panel = document.createElement('div');
  panel.id = 'seraph-panel';

  var header = document.createElement('div');
  header.id = 'seraph-header';
  var headerInfo = document.createElement('div');
  var headerName = document.createElement('div');
  headerName.className = 'name';
  headerName.textContent = 'Seraph';
  var headerSub = document.createElement('div');
  headerSub.className = 'sub';
  headerSub.textContent = 'Seraph Safety Mission';
  headerInfo.appendChild(headerName);
  headerInfo.appendChild(headerSub);
  var closeBtn = document.createElement('button');
  closeBtn.id = 'seraph-close';
  closeBtn.textContent = '\u00D7';
  header.appendChild(headerInfo);
  header.appendChild(closeBtn);

  var messagesEl = document.createElement('div');
  messagesEl.id = 'seraph-messages';

  var inputRow = document.createElement('div');
  inputRow.id = 'seraph-input-row';
  var inputEl = document.createElement('input');
  inputEl.id = 'seraph-input';
  inputEl.type = 'text';
  inputEl.placeholder = 'Type a message...';
  inputEl.autocomplete = 'off';
  var sendBtn = document.createElement('button');
  sendBtn.id = 'seraph-send';
  sendBtn.textContent = 'Send';
  inputRow.appendChild(inputEl);
  inputRow.appendChild(sendBtn);

  panel.appendChild(header);
  panel.appendChild(messagesEl);
  panel.appendChild(inputRow);
  document.body.appendChild(bubble);
  document.body.appendChild(panel);

  // ── State ──
  var ws = null;
  var isOpen = false;
  var sessionKey = 'web-' + Date.now() + '-' + Math.random().toString(36).substring(2, 8);
  var connected = false;
  var pendingRequests = {};
  var streamBuffer = '';

  function uuid() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      var r = Math.random() * 16 | 0;
      return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
  }

  function connect() {
    ws = new WebSocket(GATEWAY);

    ws.onopen = function () {
      // Send connect frame with auth (OpenClaw protocol v3)
      var connectFrame = {
        type: 'req',
        id: uuid(),
        method: 'connect',
        params: {
          minProtocol: 3,
          maxProtocol: 3,
          client: {
            id: 'openclaw-control-ui',
            version: '0.1.0',
            platform: 'web',
            mode: 'webchat'
          },
          role: 'operator',
          scopes: ['operator.admin', 'operator.write', 'operator.read'],
          caps: [],
          auth: { token: TOKEN },
          userAgent: navigator.userAgent,
          locale: navigator.language
        }
      };
      ws.send(JSON.stringify(connectFrame));
      connected = true;
    };

    ws.onmessage = function (event) {
      try {
        var frame = JSON.parse(event.data);

        // Response to a request
        if (frame.type === 'res' && frame.id && pendingRequests[frame.id]) {
          pendingRequests[frame.id](frame);
          delete pendingRequests[frame.id];
          return;
        }

        // Chat event (streaming response)
        if (frame.type === 'evt' && frame.event === 'chat') {
          var payload = frame.payload;
          if (payload && payload.delta) {
            streamBuffer += payload.delta;
            updateStreamMessage(streamBuffer);
          }
          if (payload && (payload.state === 'final' || payload.state === 'done')) {
            finalizeStreamMessage();
            streamBuffer = '';
          }
        }

        // Agent event with text content
        if (frame.type === 'evt' && frame.payload && frame.payload.content) {
          var content = frame.payload.content;
          if (typeof content === 'string') {
            addMessage('bot', content);
          } else if (Array.isArray(content)) {
            content.forEach(function (part) {
              if (part.type === 'text' && part.text) {
                addMessage('bot', part.text);
              }
            });
          }
        }
      } catch (e) {
        // Ignore parse errors
      }
    };

    ws.onclose = function () {
      connected = false;
      setTimeout(connect, 3000);
    };

    ws.onerror = function () {
      connected = false;
    };
  }

  var streamMsgEl = null;

  function updateStreamMessage(text) {
    if (!streamMsgEl) {
      streamMsgEl = document.createElement('div');
      streamMsgEl.className = 'seraph-msg bot';
      messagesEl.appendChild(streamMsgEl);
    }
    streamMsgEl.textContent = text;
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  function finalizeStreamMessage() {
    streamMsgEl = null;
  }

  function addMessage(type, text) {
    var div = document.createElement('div');
    div.className = 'seraph-msg ' + type;
    div.textContent = text;
    messagesEl.appendChild(div);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  function sanitizeInput(text) {
    if (!text) return '';
    // Strip HTML tags
    text = text.replace(/<[^>]*>/g, '');
    // Strip markdown injection attempts
    text = text.replace(/!\[.*?\]\(.*?\)/g, '');
    // Limit length
    if (text.length > 2000) text = text.substring(0, 2000);
    // Strip null bytes
    text = text.replace(/\0/g, '');
    return text.trim();
  }

  function sendMessage(text) {
    text = sanitizeInput(text);
    if (!text) return;
    addMessage('user', text);

    if (ws && ws.readyState === WebSocket.OPEN) {
      var reqId = uuid();
      var frame = {
        type: 'req',
        id: reqId,
        method: 'chat.send',
        params: {
          sessionKey: sessionKey,
          message: text,
          deliver: false,
          agentId: AGENT
        }
      };
      pendingRequests[reqId] = function (res) {
        if (!res.ok && res.error) {
          addMessage('bot', 'Sorry, I hit a snag. Try again in a moment.');
        }
      };
      ws.send(JSON.stringify(frame));

      // Show typing indicator
      addMessage('typing', 'Seraph is thinking...');
    } else {
      addMessage('bot', "I'm reconnecting... give me one second.");
    }
    inputEl.value = '';
  }

  // Remove typing indicators when real message arrives
  var origAddMessage = addMessage;
  addMessage = function (type, text) {
    // Remove any typing indicators
    var typingMsgs = messagesEl.querySelectorAll('.typing');
    typingMsgs.forEach(function (el) { el.remove(); });
    origAddMessage(type, text);
  };

  // ── Events ──
  bubble.onclick = function () {
    isOpen = !isOpen;
    panel.classList.toggle('open', isOpen);
    if (isOpen && !ws) {
      connect();
      addMessage('bot', "Hi! I'm Seraph, the AI assistant for Seraph Safety Mission. What's your name?");
    }
    if (isOpen) inputEl.focus();
  };

  closeBtn.onclick = function () {
    isOpen = false;
    panel.classList.remove('open');
  };

  sendBtn.onclick = function () { sendMessage(inputEl.value); };
  inputEl.onkeydown = function (e) {
    if (e.key === 'Enter') sendMessage(inputEl.value);
  };
})();
