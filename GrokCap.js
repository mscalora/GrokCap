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
    const blob = new Blob([textarea.value], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'extracted_text.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  let fill = () => {
    textarea.value = textarea.dataset.isRes ?
      (textarea.dataset.isSSML ? textarea.dataset.ssmlResText : textarea.dataset.plainResText) :
      (textarea.dataset.isSSML ? textarea.dataset.ssmlReqText : textarea.dataset.plainReqText);
  }; 

  const togBtn = makeBtn('Toggle SSML');
  togBtn.onclick = () => {
    //debugger;
    textarea.dataset.isSSML = textarea.dataset.isSSML ? "" : 1;
    fill();
  };

  const sqBtn = makeBtn('Show Requests');
  sqBtn.onclick = () => {
    //debugger;
    textarea.dataset.isRes = textarea.dataset.isRes ? "" : 1;
    fill();
    sqBtn.textContent = textarea.dataset.isRes ? 'Show Requests' : 'Show Responses';
  };

  // Close button
  const closeBtn = makeBtn('Close');
  closeBtn.onclick = () => {
    overlay.remove();
  };

  btnBox.appendChild(copyBtn);
  btnBox.appendChild(saveBtn);
  btnBox.appendChild(togBtn);
  btnBox.appendChild(sqBtn);
  btnBox.appendChild(closeBtn);

  overlay.appendChild(textarea);
  overlay.appendChild(btnBox);
  document.body.appendChild(overlay);

  // --- Extract and transform text ---
  
  /**
   * NEW processParagraph function.
   * Recursively walks the DOM nodes of a paragraph element.
   * Encodes all text content, and replaces <strong> tags
   * with <prosody> tags (while also encoding their content).
   */
  function processParagraph(pEl, encode) {
    // Inner recursive function to walk the DOM
    function getNodeText(node) {
      let text = '';
      if (node.nodeType === Node.TEXT_NODE) {
        // It's a text node, encode its content
        text += encode ? htmlEncode(node.textContent) : node.textContent;
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        // It's an element
        if (node.tagName === 'STRONG') {
          // Special case: <strong>
          // Get its text, encode it, and wrap in <prosody>
          const strongText = text += encode ? htmlEncode(node.textContent) : node.textContent;
          text += encode ? `<prosody volume="x-loud" rate="80%">${strongText}</prosody>` : strongText;
        } else {
          // It's any other element (like <em>, <a>, etc.)
          // Recurse into its children to get their text,
          // matching the behavior of the original .textContent
          node.childNodes.forEach(child => {
            text += getNodeText(child);
          });
        }
      }
      // Ignore other node types (comments, etc.)
      return text;
    }

    // Start the recursion on the paragraph's children
    let output = '';
    pEl.childNodes.forEach(child => {
      output += getNodeText(child);
    });
    return output;
  }

  // --- Main extraction ---
  var plainText = '', ssmlText = '<speak>\n';
  document.querySelectorAll('.message-bubble:not(.rounded-br-lg)').forEach(el => {
    el.querySelectorAll('p,h1,h2,h3,h4,h5').forEach(p => {
      let header = p.tagName != 'p';
      ssmlText += processParagraph(p, true) + (header ? ' <break strength="strong"/>\n' : ' <break/>\n');
      plainText += processParagraph(p, false) + '\n';
    });
    ssmlText += '\n<break strength="x-strong"/>\n\n';
    plainText += '\n';
  });
  ssmlText += '</speak>';

  textarea.dataset.plainResText = plainText;
  textarea.dataset.ssmlResText = ssmlText;
  plainText = ''; ssmlText = '<speak>\n';

  document.querySelectorAll('.message-bubble.rounded-br-lg').forEach(el => {
    el.querySelectorAll('p').forEach(p => {
      ssmlText += processParagraph(p, true) + ' <break/>\n';
      plainText += processParagraph(p, false) + '\n';
    });
    ssmlText += '\n<break strength="x-strong"/>\n\n';
    plainText += '\n';
  });
  ssmlText += '</speak>';

  textarea.dataset.plainReqText = plainText;
  textarea.dataset.ssmlReqText = ssmlText;

  textarea.dataset.isSSML = "";
  textarea.dataset.isRes = 1;
  fill();
})();