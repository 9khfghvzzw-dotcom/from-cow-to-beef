// Update live meters without detaching buttons during pointer/keyboard actions.
export function patchMarkup(element, html) {
  const template = document.createElement('template');
  template.innerHTML = html;
  function sync(parent, desired) {
    const next = Array.from(desired.childNodes);
    next.forEach((node, index) => {
      const current = parent.childNodes[index];
      if (!current) { parent.append(node.cloneNode(true)); return; }
      if (current.nodeType !== node.nodeType || current.nodeName !== node.nodeName) {
        current.replaceWith(node.cloneNode(true)); return;
      }
      if (node.nodeType === Node.TEXT_NODE) {
        if (current.textContent !== node.textContent) current.textContent = node.textContent;
        return;
      }
      if (node.nodeType !== Node.ELEMENT_NODE) return;
      for (const attr of Array.from(current.attributes)) {
        if(current.nodeName==='DETAILS'&&attr.name==='open')continue;
        if (!node.hasAttribute(attr.name)) current.removeAttribute(attr.name);
      }
      for (const attr of node.attributes) {
        if (current.getAttribute(attr.name) !== attr.value) current.setAttribute(attr.name, attr.value);
      }
      sync(current, node);
    });
    while (parent.childNodes.length > next.length) parent.lastChild.remove();
  }
  sync(element, template.content);
}
