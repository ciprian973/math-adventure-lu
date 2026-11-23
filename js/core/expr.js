/* =====================================================================
 * expr.js — arithmetic expressions as token arrays, exact evaluation
 * (priority of × and : over + and −, parentheses) and display.
 * Tokens: numbers (number | MQ.Q), '+', '-', '*', '/', '(', ')', '□'
 * ===================================================================== */
(function (root) {
  'use strict';
  const MQ = root.MQ = root.MQ || {};
  const PREC = { '+': 1, '-': 1, '*': 2, '/': 2 };

  function evaluate(tokens) {
    const Q = MQ.Q, out = [], ops = [];
    const apply = () => {
      const op = ops.pop(), b = out.pop(), a = out.pop();
      if (a == null || b == null) throw new Error('bad expression');
      out.push(op === '+' ? a.add(b) : op === '-' ? a.sub(b) : op === '*' ? a.mul(b) : a.div(b));
    };
    for (const tk of tokens) {
      if (typeof tk === 'number' || tk instanceof Q) out.push(Q.of(tk));
      else if (tk === '(') ops.push(tk);
      else if (tk === ')') { while (ops.length && ops[ops.length - 1] !== '(') apply(); ops.pop(); }
      else if (PREC[tk]) { while (ops.length && PREC[ops[ops.length - 1]] >= PREC[tk]) apply(); ops.push(tk); }
      else throw new Error('unknown token ' + tk);
    }
    while (ops.length) apply();
    if (out.length !== 1) throw new Error('bad expression');
    return out[0];
  }

  /* the calculation one operation at a time, as a child writes it: innermost brackets first,
     × and : before + and −, from left to right. Returns the list of token arrays (first = the expression). */
  function calcSteps(tokens) {
    const isOp = t => t === '+' || t === '-' || t === '*' || t === '/';
    const once = tk => {
      let open = -1, close = tk.length;
      for (let i = 0; i < tk.length; i++) { if (tk[i] === '(') open = i; if (tk[i] === ')') { close = i; break; } }
      const seg = tk.slice(open + 1, close);
      if (open >= 0 && seg.length === 1) return tk.slice(0, open).concat(seg, tk.slice(close + 1));
      let i = seg.findIndex(t => t === '*' || t === '/'); if (i < 0) i = seg.findIndex(isOp);
      const v = evaluate([seg[i - 1], seg[i], seg[i + 1]]);
      const ns = seg.slice(0, i - 1).concat([v], seg.slice(i + 2));
      return open >= 0 && ns.length === 1 ? tk.slice(0, open).concat(ns, tk.slice(close + 1)) : tk.slice(0, open + 1).concat(ns, tk.slice(close));
    };
    const out = [tokens.slice()]; let cur = tokens.slice(), g = 0;
    while (cur.length > 1 && g++ < 40) { cur = once(cur); out.push(cur); }
    return out;
  }
  function exprToString(tokens, lang) {
    const st = MQ.i18n || { mulSign: '×', divSign: ':' };
    return tokens.map(tk => {
      if (typeof tk === 'number' || tk instanceof MQ.Q) return MQ.fmtNum(tk, lang);
      if (tk === '*') return st.mulSign;
      if (tk === '/') return st.divSign;
      if (tk === '-') return '−';
      if (tk === '□') return '<span class="box" aria-label="?">□</span>';
      return tk;
    }).join(' ').replace(/\( /g, '(').replace(/ \)/g, ')');
  }

  MQ.evalExpr = evaluate;
  MQ.exprToString = exprToString;
  MQ.calcSteps = calcSteps;
  if (typeof module !== 'undefined') module.exports = MQ;
})(typeof window !== 'undefined' ? window : globalThis);
