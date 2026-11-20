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
  if (typeof module !== 'undefined') module.exports = MQ;
})(typeof window !== 'undefined' ? window : globalThis);
