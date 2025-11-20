(() => {
  // --- HTML entity map and encoder function ---
  const entityMap = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&apos;',
  };

  function htmlEncode(str) {
    if (!str) return '';
    // Use a regex to replace all special chars at once
    return String(str).replace(/[&<>"']/g, (s) => entityMap[s]);
  }

  // --- Create overlay container ---
  const overlay = document.createElement('div');
  overlay.style.position = 'fixed';
  overlay.style.top = '50%';
  overlay.style.left = '50%';
  overlay.style.transform = 'translate(-50%, -50%)';
  overlay.style.width = '75vw';
  overlay.style.height = '75vh';
  overlay.style.background = 'white';
  overlay.style.border = '2px solid #333';
  overlay.style.borderRadius = '12px';
  overlay.style.boxShadow = '0 0 30px rgba(0,0,0,0.3)';
  overlay.style.zIndex = '999999';
  overlay.style.padding = '16px';
  overlay.style.display = 'flex';
  overlay.style.flexDirection = 'column';
  overlay.style.gap = '10px';
  overlay.style.fontFamily = 'Arial, sans-serif';

  // --- Controls (sticky settings) ---
  const LS_KEYS = {
    includeResponses: 'txt2mp3_useResponses',
    outputSSML: 'txt2mp3_outputSSML',
  };

  const controlsRow = document.createElement('div');
  controlsRow.style.display = 'flex';
  controlsRow.style.gap = '12px';
  controlsRow.style.alignItems = 'center';

  function makeCheckbox(labelText, key, defaultValue) {
    const wrapper = document.createElement('label');
    wrapper.style.display = 'inline-flex';
    wrapper.style.alignItems = 'center';
    wrapper.style.gap = '6px';
    wrapper.style.color = '#000'; // ensure label is visible
    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.style.marginRight = '6px';
    // give the input a predictable name/id so it's accessible in the DOM
    cb.name = `txt2mp3_${key}`;
    cb.id = `txt2mp3_${key}`;
    const stored = localStorage.getItem(key);
    // accept both '1'/'0' and 'true'/'false' for compatibility
    cb.checked = stored === null ? !!defaultValue : (stored === '1' || stored === 'true');
    cb.onchange = () => {
      localStorage.setItem(key, cb.checked ? '1' : '0');
      regenerate(); // update output when user toggles
    };
    const span = document.createElement('span');
    span.textContent = labelText;
    span.style.userSelect = 'none';
    span.style.color = '#000';
    span.style.fontWeight = '600';
    wrapper.appendChild(cb);
    wrapper.appendChild(span);
    return { wrapper, cb };
  }

  // first checkbox label "Requests" default ON, second "SSML" default OFF
  const includeRes = makeCheckbox('Requests', LS_KEYS.includeResponses, true);
  const outputSSML = makeCheckbox('SSML', LS_KEYS.outputSSML, false);

  controlsRow.appendChild(includeRes.wrapper);
  controlsRow.appendChild(outputSSML.wrapper);

  // --- Create textarea ---
  const textarea = document.createElement('textarea');
  textarea.style.flex = '1';
  textarea.style.width = '100%';
  textarea.style.resize = 'none';
  textarea.style.padding = '10px';
  textarea.style.fontSize = '14px';
  textarea.style.border = '1px solid #ccc';
  textarea.style.borderRadius = '6px';
  textarea.style.boxSizing = 'border-box';
  textarea.placeholder = 'Extracted text will appear here...';

  // --- Buttons container ---
  const btnBox = document.createElement('div');
  btnBox.style.display = 'flex';
  btnBox.style.justifyContent = 'space-between';

  // --- Helper to create buttons ---
  function makeBtn(label) {
    const btn = document.createElement('button');
    btn.textContent = label;
    btn.style.padding = '8px 16px';
    btn.style.fontSize = '14px';
    btn.style.cursor = 'pointer';
    btn.style.borderRadius = '6px';
    btn.style.border = '1px solid #333';
    btn.style.background = '#f2f2f2';
    btn.style.color = '#000';
    return btn;
  }

  // Copy button
  const copyBtn = makeBtn('Copy');
  copyBtn.onclick = () => {
    navigator.clipboard.writeText(textarea.value);
    copyBtn.textContent = 'Copied!';
    setTimeout(() => (copyBtn.textContent = 'Copy'), 1500);
  };

  // Save as file button
  const saveBtn = makeBtn('Save as file');
  saveBtn.onclick = () => {
    // slugify first three words of document title as default name
    function slugifyTitle(title) {
      if (!title) return 'extracted-text';
      // remove punctuation, keep letters/numbers/space/hyphen, lowercase
      const cleaned = String(title).toLowerCase().trim().replace(/[^\w\s-]/g, '');
      const parts = cleaned.split(/\s+/).filter(Boolean).slice(0, 3);
      return parts.length ? parts.join('-') : 'extracted-text';
    }

    const titleSlug = slugifyTitle(document.title);
    const defaultName = `${titleSlug}.txt`;
    const last = localStorage.getItem('txt2mp3_lastFilename') || defaultName;
    let filename = prompt('Save as (enter filename):', last);
    if (!filename) return; // cancelled
    filename = filename.trim();
    if (filename === '') return;
    if (!filename.includes('.')) filename += '.txt';
    localStorage.setItem('txt2mp3_lastFilename', filename);

    const blob = new Blob([textarea.value], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  // Close button
  const closeBtn = makeBtn('Close');
  closeBtn.onclick = () => {
    overlay.remove();
  };

  btnBox.appendChild(copyBtn);
  btnBox.appendChild(saveBtn);
  btnBox.appendChild(closeBtn);

  overlay.appendChild(controlsRow);
  overlay.appendChild(textarea);
  overlay.appendChild(btnBox);
  document.body.appendChild(overlay);

  // --- Extract and transform text ---

  /**
   * NEW processParagraph function.
   * Recursively walks the DOM nodes of a paragraph element.
   * Encodes all text content, and replaces <strong> tags
   * with <prosody> tags when SSML output is requested.
   */
  function processParagraph(pEl, useSSML) {
    function getNodeText(node) {
      let text = '';
      if (node.nodeType === Node.TEXT_NODE) {
        text += useSSML ? htmlEncode(node.textContent) : node.textContent;
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        if (node.tagName === 'STRONG') {
          const strongText = node.textContent;
          const encodedStrongText = useSSML ? htmlEncode(strongText) : strongText;
          if (useSSML) {
            text += `<prosody volume="x-loud" rate="80%">${encodedStrongText}</prosody>`;
          } else {
            text += encodedStrongText;
          }
        } else {
          node.childNodes.forEach(child => {
            text += getNodeText(child);
          });
        }
      }
      return text;
    }

    let output = '';
    pEl.childNodes.forEach(child => {
      output += getNodeText(child);
    });
    return output;
  }

  // --- Main extraction (regeneratable) ---
  function regenerate() {
    const includeResponsesChecked = includeRes.cb.checked;
    const useSSML = outputSSML.cb.checked;

    const selector = includeResponsesChecked
      ? '.message-bubble:not(.rounded-br-lg)'
      : '.message-bubble';

    textarea.value = '';
    if (useSSML) textarea.value += '<speak>\n';

    document.querySelectorAll(selector).forEach(el => {
      el.querySelectorAll('p, h1, h2, h3, h4, h5, li').forEach(p => {
        const processed = processParagraph(p, useSSML);
        if (useSSML) {
          textarea.value += processed + ' <break/>\n\n';
        } else {
          textarea.value += processed + '\n\n';
        }
      });
      if (useSSML) {
        textarea.value += '\n<break strength="x-strong"/>\n\n';
      } else {
        textarea.value += '\n\n';
      }
    });

    if (useSSML) textarea.value += '</speak>';
  }

  // initial populate
  regenerate();
})();