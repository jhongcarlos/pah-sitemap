export function newId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return `n-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function mapTree(nodes, id, fn) {
  return nodes.map((n) => {
    if (n.id === id) return fn(n);
    if (n.children?.length) return { ...n, children: mapTree(n.children, id, fn) };
    return n;
  });
}

export function removeFromTree(nodes, id) {
  return nodes
    .filter((n) => n.id !== id)
    .map((n) => (n.children?.length ? { ...n, children: removeFromTree(n.children, id) } : n));
}

export function addChildToTree(nodes, parentId, newNode) {
  return nodes.map((n) => {
    if (n.id === parentId) return { ...n, children: [...(n.children || []), newNode] };
    if (n.children?.length) return { ...n, children: addChildToTree(n.children, parentId, newNode) };
    return n;
  });
}
