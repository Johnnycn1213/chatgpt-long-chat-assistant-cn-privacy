(() => {
  const app = (window.ChatGPTLongChatOptimizerCN =
    window.ChatGPTLongChatOptimizerCN || {});

  const TURN_SELECTOR =
    'section[data-turn-id], article[data-turn-id], [data-testid^="conversation-turn-"]';
  const ROLE_SELECTOR = "[data-message-author-role]";
  const USER_ROLE_SELECTOR = '[data-message-author-role="user"]';

  function isOwnNode(node) {
    return Boolean(
      node?.closest?.(
        "#cnlco-shadow-host, .cnlco-turn-placeholder, .cnlco-turn-tools, .cnlco-long-control"
      )
    );
  }

  function findTurnRoot(node) {
    if (!node || !(node instanceof Element)) return null;

    return (
      node.closest(TURN_SELECTOR) ||
      node.closest("section") ||
      node.closest("article")
    );
  }

  function uniqueInDocumentOrder(nodes) {
    const seen = new Set();
    const result = [];

    for (const node of nodes) {
      if (!node || seen.has(node) || isOwnNode(node)) continue;
      seen.add(node);
      result.push(node);
    }

    result.sort((a, b) => {
      if (a === b) return 0;
      const position = a.compareDocumentPosition(b);
      return position & Node.DOCUMENT_POSITION_PRECEDING ? 1 : -1;
    });

    return result;
  }

  function getTurnElements() {
    if (!document.body) return [];

    const direct = uniqueInDocumentOrder(
      Array.from(document.querySelectorAll(TURN_SELECTOR))
    );

    if (direct.length) return direct;

    const roleNodes = Array.from(document.querySelectorAll(ROLE_SELECTOR));
    const turns = roleNodes.map(findTurnRoot).filter(Boolean);

    return uniqueInDocumentOrder(turns);
  }

  function detectTurnRole(turn) {
    if (!turn || !(turn instanceof Element)) return "unknown";

    const roleNode = turn.matches(ROLE_SELECTOR)
      ? turn
      : turn.querySelector(ROLE_SELECTOR);

    const role = roleNode?.getAttribute("data-message-author-role");
    if (role === "user" || role === "assistant") return role;

    return "unknown";
  }

  function getUserMessageRoot(turn) {
    if (!turn || !(turn instanceof Element)) return null;

    if (turn.matches(USER_ROLE_SELECTOR)) return turn;
    return turn.querySelector(USER_ROLE_SELECTOR);
  }

  app.scanner = {
    getTurnElements,
    detectTurnRole,
    getUserMessageRoot
  };
})();
