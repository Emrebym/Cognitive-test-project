import { useState, useEffect, useCallback, useRef, useContext, useMemo } from 'react';
import { LangCtx, ThemeCtx, PausedCtx } from './contexts';
import { useThemeColors } from './hooks/useThemeColors';
import { T } from './data/translations';
import { buildSections, DC } from './utils/helpers';
import { calculateResults } from './utils/iqCalculation';

/* ══════════════════════════════════════════
   UI ATOMS
   ══════════════════════════════════════════ */
function Bar({ value, color, h = 5, animate }) {
  const tc = useThemeColors();
  return (
    <div style={{ background: tc.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)', borderRadius: 999, height: h, overflow: 'hidden' }}>
      <div style={{ width: `${Math.max(0, Math.min(100, value))}%`, background: `linear-gradient(90deg,${color},${color}cc)`, height: '100%', borderRadius: 999, transition: animate ? 'width 1.4s cubic-bezier(0.4,0,0.2,1)' : 'width 0.4s ease', boxShadow: `0 0 12px ${color}40` }} />
    </div>
  );
}

function Countdown({ total, color, onExpire, stopped }) {
  const [rem, setRem] = useState(total);
  const fired = useRef(false);
  const lang = useContext(LangCtx);
  const paused = useContext(PausedCtx);
  const tc = useThemeColors();
  const tx = T[lang];

  useEffect(() => {
    if (stopped || fired.current || paused) return;
    if (rem <= 0) { if (!fired.current) { fired.current = true; onExpire(); } return; }
    const id = setTimeout(() => setRem(r => r - 1), 1000);
    return () => clearTimeout(id);
  }, [rem, stopped, onExpire, paused]);

  const urgent = rem <= 5 && !paused;
  const cl = paused ? tc.textM : urgent ? '#EF4444' : color;

  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <span style={{ fontSize: 10, color: tc.textM, letterSpacing: 2.5, fontWeight: 600, fontFamily: "'JetBrains Mono',monospace" }}>{tx.timeRemaining}</span>
        <span style={{ fontSize: 20, fontWeight: 800, color: cl, fontVariantNumeric: 'tabular-nums', fontFamily: "'Outfit',sans-serif", animation: urgent ? 'countdownPulse 0.5s infinite' : 'none', textShadow: urgent ? `0 0 20px ${cl}60` : 'none' }}>{rem}s</span>
      </div>
      <div style={{ position: 'relative', height: 5, borderRadius: 999, background: tc.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, height: '100%', borderRadius: 999, width: `${(rem / total) * 100}%`, background: `linear-gradient(90deg,${cl},${cl}aa)`, transition: 'width 1s linear', boxShadow: urgent ? `0 0 16px ${cl}60` : `0 0 8px ${cl}30` }} />
      </div>
    </div>
  );
}

function Badge({ level, lang }) {
  return (
    <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: 1.5, color: DC[level], background: `${DC[level]}12`, border: `1px solid ${DC[level]}30`, borderRadius: 6, padding: '3px 9px', fontFamily: "'JetBrains Mono',monospace", textTransform: 'uppercase' }}>
      {T[lang].difLabels[level]}
    </span>
  );
}

function Btn({ onClick, disabled, color, children, outline }) {
  const tc = useThemeColors();
  const [hov, setHov] = useState(false);
  const active = !disabled;
  const bg = outline ? 'transparent' : active ? `linear-gradient(135deg,${color},${color}dd)` : tc.isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)';
  const textC = outline ? (active ? color : tc.textM) : active ? '#000' : tc.textM;
  return (
    <button onClick={onClick} disabled={disabled} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ marginTop: 14, width: '100%', padding: '12px 16px', background: bg, color: textC, border: outline ? `1.5px solid ${active ? `${color}60` : tc.cardBorder}` : 'none', borderRadius: 12, fontSize: 13, fontWeight: 700, cursor: active ? 'pointer' : 'default', fontFamily: "'Outfit',sans-serif", transition: 'all 0.25s cubic-bezier(0.4,0,0.2,1)', boxShadow: hov && active ? `0 6px 28px ${color}40` : active && !outline ? `0 4px 20px ${color}30` : 'none', letterSpacing: 0.3, transform: hov && active ? 'translateY(-1px)' : 'none', opacity: disabled ? 0.4 : 1 }}>
      {children}
    </button>
  );
}

function ChoiceButton({ label, index, picked, answer, done, onClick }) {
  const tc = useThemeColors();
  let bg = tc.card, brd = tc.cardBorder, textC = tc.textS;
  if (done) {
    if (label === answer) { bg = 'rgba(16,185,129,0.12)'; brd = '#10B98155'; textC = '#10B981'; }
    else if (label === picked) { bg = 'rgba(239,68,68,0.12)'; brd = '#EF444455'; textC = '#EF4444'; }
  }
  return (
    <button className="choice-btn" onClick={() => onClick(label)}
      style={{ padding: '13px 16px', background: bg, border: `1.5px solid ${brd}`, borderRadius: 12, color: textC, fontSize: 14, fontWeight: 600, cursor: done ? 'default' : 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 12, fontFamily: "'Outfit',sans-serif", width: '100%', transition: 'all 0.2s' }}>
      <span style={{ width: 26, height: 26, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, fontFamily: "'JetBrains Mono',monospace", background: done && label === answer ? 'rgba(16,185,129,0.15)' : done && label === picked ? 'rgba(239,68,68,0.15)' : tc.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)', color: done && label === answer ? '#10B981' : done && label === picked ? '#EF4444' : tc.textM, flexShrink: 0 }}>
        {String.fromCharCode(65 + index)}
      </span>
      {label}
    </button>
  );
}

/* ══════════════════════════════════════════
   QUESTION COMPONENTS
   ══════════════════════════════════════════ */

function SequenceQ({ q, color, onAnswer }) {
  const [phase, setPhase] = useState('show');
  const [val, setVal] = useState('');
  const done = useRef(false);
  const t0 = useRef(Date.now());
  const lang = useContext(LangCtx);
  const tc = useThemeColors();
  const tx = T[lang];
  const isRev = q.type === 'reverse-sequence';

  useEffect(() => {
    const t = setTimeout(() => { setPhase('recall'); t0.current = Date.now(); }, q.display);
    return () => clearTimeout(t);
  }, [q.display]);

  const submit = useCallback(v => {
    if (done.current) return;
    done.current = true;
    setTimeout(() => onAnswer(v === q.answer, Math.round((Date.now() - t0.current) / 1000)), 700);
  }, [q.answer, onAnswer]);

  const expire = useCallback(() => { if (!done.current) submit(''); }, [submit]);

  if (phase === 'show') return (
    <div style={{ textAlign: 'center' }}>
      <p style={{ color: tc.textM, fontSize: 12, marginBottom: 16, fontFamily: "'JetBrains Mono',monospace" }}>{tx.memorize(q.display / 1000)}</p>
      {isRev && <p style={{ color, fontSize: 11, fontWeight: 700, letterSpacing: 3, marginBottom: 14, fontFamily: "'JetBrains Mono',monospace" }}>⟵ {lang === 'tr' ? 'TERS SIRA' : 'REVERSE ORDER'}</p>}
      <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
        {q.sequence.map((n, i) => (
          <div key={i} className="scaleIn" style={{ width: 56, height: 56, borderRadius: 14, background: `${color}10`, border: `2px solid ${color}50`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 800, color, fontFamily: "'Outfit',sans-serif", boxShadow: `0 0 20px ${color}15`, animationDelay: `${i * 0.1}s` }}>{n}</div>
        ))}
      </div>
    </div>
  );

  return (
    <div>
      <Countdown total={q.timeLimit} color={color} onExpire={expire} stopped={done.current} />
      <p style={{ color: isRev ? color : tc.textM, fontSize: 12, fontWeight: isRev ? 700 : 400, marginBottom: 14, fontFamily: "'JetBrains Mono',monospace" }}>{isRev ? tx.enterRevSeq : tx.enterSeq}</p>
      <input autoFocus value={val} disabled={done.current}
        onChange={e => setVal(e.target.value.replace(/\D/g, '').slice(0, q.sequence.length))}
        onKeyDown={e => e.key === 'Enter' && val.length === q.sequence.length && submit(val)}
        style={{ width: '100%', padding: '14px', fontSize: 28, letterSpacing: 14, textAlign: 'center', background: tc.inputBg, border: `2px solid ${val.length === q.sequence.length ? color : tc.inputBorder}`, borderRadius: 14, color: tc.textP, boxSizing: 'border-box', fontFamily: "'JetBrains Mono',monospace", transition: 'border-color 0.3s' }}
        placeholder={'_ '.repeat(q.sequence.length).trim()} />
      <Btn onClick={() => submit(val)} disabled={val.length !== q.sequence.length || done.current} color={color}>{tx.confirm}</Btn>
    </div>
  );
}

function WordRecallQ({ q, color, onAnswer }) {
  const [phase, setPhase] = useState('show');
  const [sel, setSel] = useState([]);
  const done = useRef(false);
  const t0 = useRef(Date.now());
  const lang = useContext(LangCtx);
  const tc = useThemeColors();
  const tx = T[lang];

  useEffect(() => { const t = setTimeout(() => { setPhase('recall'); t0.current = Date.now(); }, 4500); return () => clearTimeout(t); }, []);

  const submit = useCallback(s => {
    if (done.current) return;
    done.current = true;
    const ok = Array.isArray(q.answer) ? q.answer.every(w => s.includes(w)) && s.length === q.answer.length : s[0] === q.answer;
    setTimeout(() => onAnswer(ok, Math.round((Date.now() - t0.current) / 1000)), 700);
  }, [q.answer, onAnswer]);

  const expire = useCallback(() => { if (!done.current) submit(sel); }, [submit, sel]);
  const toggle = w => { if (done.current) return; setSel(s => s.includes(w) ? s.filter(x => x !== w) : [...s, w]); };
  const needed = Array.isArray(q.answer) ? q.answer.length : 1;

  if (phase === 'show') return (
    <div style={{ textAlign: 'center' }}>
      <p style={{ color: tc.textM, fontSize: 12, marginBottom: 16, fontFamily: "'JetBrains Mono',monospace" }}>{tx.memorize(4.5)}</p>
      <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
        {q.words.map((w, i) => (
          <div key={i} className="scaleIn" style={{ padding: '12px 22px', background: `${color}10`, border: `2px solid ${color}50`, borderRadius: 12, color, fontWeight: 700, fontSize: 13, letterSpacing: 2.5, fontFamily: "'JetBrains Mono',monospace", boxShadow: `0 0 20px ${color}15`, animationDelay: `${i * 0.1}s` }}>{w}</div>
        ))}
      </div>
    </div>
  );

  return (
    <div>
      <Countdown total={q.timeLimit} color={color} onExpire={expire} stopped={done.current} />
      <p style={{ color: tc.textM, fontSize: 12, marginBottom: 14, fontFamily: "'JetBrains Mono',monospace" }}>{tx.selectWords(needed)}</p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
        {q.choices.map((w, i) => {
          const on = sel.includes(w);
          return (
            <button key={i} className="choice-btn" onClick={() => toggle(w)} style={{ padding: '10px 18px', background: on ? `${color}15` : tc.inputBg, border: `1.5px solid ${on ? `${color}60` : tc.inputBorder}`, borderRadius: 10, color: on ? color : tc.textS, fontWeight: 600, fontSize: 12, cursor: done.current ? 'default' : 'pointer', letterSpacing: 1.5, fontFamily: "'JetBrains Mono',monospace", boxShadow: on ? `0 0 12px ${color}20` : 'none' }}>{w}</button>
          );
        })}
      </div>
      <Btn onClick={() => submit(sel)} disabled={sel.length !== needed || done.current} color={color}>{tx.confirmSel}</Btn>
    </div>
  );
}

function SpatialGridQ({ q, color, onAnswer }) {
  const [phase, setPhase] = useState('show');
  const [sel, setSel] = useState([]);
  const done = useRef(false);
  const t0 = useRef(Date.now());
  const lang = useContext(LangCtx);
  const tc = useThemeColors();
  const tx = T[lang];
  const n = q.gridSize, total = n * n;

  useEffect(() => { const t = setTimeout(() => { setPhase('recall'); t0.current = Date.now(); }, q.display); return () => clearTimeout(t); }, [q.display]);

  const submit = useCallback(s => {
    if (done.current) return;
    done.current = true;
    const ok = q.cells.length === s.length && q.cells.every(c => s.includes(c));
    setTimeout(() => onAnswer(ok, Math.round((Date.now() - t0.current) / 1000)), 700);
  }, [q.cells, onAnswer]);

  const expire = useCallback(() => { if (!done.current) submit(sel); }, [submit, sel]);
  const toggle = i => { if (done.current || phase === 'show') return; setSel(s => s.includes(i) ? s.filter(x => x !== i) : [...s, i]); };
  const cs = n === 5 ? 48 : 56;

  const grid = (interactive) => (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${n},${cs}px)`, gap: 5, margin: '0 auto', width: 'fit-content' }}>
      {Array.from({ length: total }, (_, i) => {
        const isT = q.cells.includes(i), isSel = sel.includes(i);
        let bg, border;
        if (!interactive) { bg = isT ? `${color}30` : tc.inputBg; border = isT ? `2px solid ${color}` : `1px solid ${tc.inputBorder}`; }
        else if (done.current) { bg = isT && isSel ? 'rgba(16,185,129,0.2)' : isT || isSel ? 'rgba(239,68,68,0.15)' : 'transparent'; border = isT && isSel ? '2px solid #10B981' : isT || isSel ? '2px solid #EF4444' : `1px solid ${tc.inputBorder}`; }
        else { bg = isSel ? `${color}15` : tc.inputBg; border = isSel ? `2px solid ${color}` : `1px solid ${tc.inputBorder}`; }
        return (
          <div key={i} onClick={() => toggle(i)} style={{ width: cs, height: cs, background: bg, border, borderRadius: 10, cursor: interactive && !done.current ? 'pointer' : 'default', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {!interactive && isT && <div style={{ width: 22, height: 22, borderRadius: 7, background: color, boxShadow: `0 0 16px ${color}40` }} />}
            {interactive && isSel && !done.current && <div style={{ width: 18, height: 18, borderRadius: 6, background: color, opacity: 0.8 }} />}
          </div>
        );
      })}
    </div>
  );

  if (phase === 'show') return (
    <div style={{ textAlign: 'center' }}>
      <p style={{ color: tc.textM, fontSize: 12, marginBottom: 16, fontFamily: "'JetBrains Mono',monospace" }}>{tx.memorize(q.display / 1000)}</p>
      {grid(false)}
    </div>
  );

  return (
    <div>
      <Countdown total={q.timeLimit} color={color} onExpire={expire} stopped={done.current} />
      <p style={{ color: tc.textM, fontSize: 12, marginBottom: 14, fontFamily: "'JetBrains Mono',monospace" }}>{tx.selectCells}</p>
      {grid(true)}
      <Btn onClick={() => submit(sel)} disabled={sel.length !== q.cells.length || done.current} color={color}>{tx.confirmSel}</Btn>
    </div>
  );
}

function StoryRecallQ({ q, color, onAnswer }) {
  const [phase, setPhase] = useState('show');
  const [picked, setPicked] = useState(null);
  const done = useRef(false);
  const t0 = useRef(Date.now());
  const lang = useContext(LangCtx);
  const tc = useThemeColors();
  const tx = T[lang];

  useEffect(() => { const t = setTimeout(() => { setPhase('recall'); t0.current = Date.now(); }, q.display); return () => clearTimeout(t); }, [q.display]);

  const expire = useCallback(() => { if (!done.current) { done.current = true; setTimeout(() => onAnswer(false, q.timeLimit, true), 700); } }, [onAnswer, q.timeLimit]);

  const pick = c => {
    if (done.current) return;
    done.current = true;
    setPicked(c);
    setTimeout(() => onAnswer(c === q.answer, Math.round((Date.now() - t0.current) / 1000), false), 700);
  };

  if (phase === 'show') return (
    <div>
      <p style={{ color: tc.textM, fontSize: 12, marginBottom: 16, fontFamily: "'JetBrains Mono',monospace" }}>{tx.storyRead(q.display / 1000)}</p>
      <div style={{ background: tc.inputBg, border: `1px solid ${tc.inputBorder}`, borderRadius: 14, padding: '20px 22px', fontSize: 15, lineHeight: 1.9, color: tc.textS, fontStyle: 'italic', fontFamily: "'Outfit',sans-serif" }}>"{q.story}"</div>
    </div>
  );

  return (
    <div>
      <Countdown total={q.timeLimit} color={color} onExpire={expire} stopped={done.current} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {q.choices.map((c, i) => <ChoiceButton key={i} label={c} index={i} picked={picked} answer={q.answer} done={done.current} onClick={pick} />)}
      </div>
    </div>
  );
}

function NBackQ({ q, color, onAnswer }) {
  const [step, setStep] = useState(0);
  const [phase, setPhase] = useState('show');
  const [pressedAnswer, setPressedAnswer] = useState(null);
  const done = useRef(false);
  const responsesRef = useRef([]);
  const lang = useContext(LangCtx);
  const tc = useThemeColors();
  const tx = T[lang];
  const seq = q.sequence;
  const total = seq.length;

  useEffect(() => {
    if (step >= total) {
      if (!done.current) {
        done.current = true;
        const finalR = [...responsesRef.current];
        while (finalR.length < total) finalR.push(false);
        const correct = finalR.filter((r, i) => i >= q.n && r === q.targets[i]).length;
        const possible = q.targets.slice(q.n).length;
        const ok = correct >= Math.ceil(possible * 0.6);
        setTimeout(() => onAnswer(ok, Math.round(total * 2)), 700);
      }
      return;
    }
    setPhase('show');
    setPressedAnswer(null);
    const showT = setTimeout(() => {
      setPhase(step >= q.n ? 'respond' : 'wait');
      const waitT = setTimeout(() => {
        if (responsesRef.current.length === step) responsesRef.current = [...responsesRef.current, false];
        setStep(s => s + 1);
      }, step >= q.n ? 1800 : 900);
      return () => clearTimeout(waitT);
    }, 1000);
    return () => clearTimeout(showT);
  }, [step]);

  const respond = same => {
    if (pressedAnswer !== null || phase !== 'respond') return;
    setPressedAnswer(same);
    responsesRef.current = [...responsesRef.current.slice(0, step), same];
  };

  if (step >= total) return <div style={{ textAlign: 'center', padding: 20, fontSize: 32, color: '#10B981' }}>✓</div>;

  return (
    <div>
      <div style={{ marginBottom: 18 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: tc.textM, marginBottom: 6, fontFamily: "'JetBrains Mono',monospace", letterSpacing: 1.5 }}>
          <span>{lang === 'tr' ? 'ADIM' : 'STEP'} {step + 1}/{total}</span><span>2-BACK</span>
        </div>
        <Bar value={(step / total) * 100} color={color} h={4} />
      </div>
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <div style={{ width: 120, height: 120, borderRadius: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto', transition: 'all 0.35s', background: phase === 'show' ? `${color}12` : tc.inputBg, border: `3px solid ${phase === 'show' ? `${color}60` : tc.inputBorder}`, boxShadow: phase === 'show' ? `0 0 30px ${color}20` : 'none' }}>
          <span style={{ fontSize: 26, fontWeight: 800, fontFamily: "'Outfit',sans-serif", color: phase === 'show' ? color : tc.textM }}>{phase === 'show' ? seq[step] : '?'}</span>
        </div>
        <p style={{ color: tc.textM, fontSize: 11, marginTop: 14, fontFamily: "'JetBrains Mono',monospace" }}>{step >= q.n ? tx.nBackQ : (lang === 'tr' ? 'Ezberle...' : 'Memorize...')}</p>
      </div>
      {step >= q.n && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {[true, false].map(same => {
            const isPressed = pressedAnswer !== null && pressedAnswer === same;
            const clr = same ? '#10B981' : '#EF4444';
            return (
              <button key={String(same)} onClick={() => respond(same)} className="choice-btn"
                style={{ padding: '16px', borderRadius: 14, fontSize: 15, fontWeight: 700, fontFamily: "'Outfit',sans-serif", border: `2px solid ${clr}50`, background: isPressed ? `${clr}18` : tc.inputBg, color: clr, cursor: phase === 'respond' && pressedAnswer === null ? 'pointer' : 'default', opacity: pressedAnswer !== null && !isPressed ? 0.25 : phase !== 'respond' ? 0.3 : 1, transform: isPressed ? 'scale(0.97)' : 'scale(1)', transition: 'all 0.2s' }}>
                {same ? tx.yes : tx.no}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function MatrixQ({ q, color, onAnswer }) {
  const [picked, setPicked] = useState(null);
  const done = useRef(false);
  const t0 = useRef(Date.now());
  const tc = useThemeColors();

  const expire = useCallback(() => { if (!done.current) { done.current = true; setTimeout(() => onAnswer(false, q.timeLimit, true), 700); } }, [onAnswer, q.timeLimit]);
  const pick = v => { if (done.current) return; done.current = true; setPicked(v); setTimeout(() => onAnswer(v === q.answer, Math.round((Date.now() - t0.current) / 1000), false), 700); };

  return (
    <div>
      <Countdown total={q.timeLimit} color={color} onExpire={expire} stopped={done.current} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 6, marginBottom: 20 }}>
        {q.grid.map((cell, i) => {
          const isQ = cell === '?';
          return (
            <div key={i} style={{ height: 58, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: isQ ? 24 : 15, fontWeight: 700, fontFamily: "'Outfit',sans-serif", background: isQ ? `${color}10` : tc.inputBg, border: isQ ? `2px dashed ${color}60` : `1px solid ${tc.inputBorder}`, color: isQ ? color : tc.textS, animation: isQ ? 'breathe 2s infinite' : 'none' }}>{cell}</div>
          );
        })}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {q.choices.map((v, i) => <ChoiceButton key={i} label={v} index={i} picked={picked} answer={q.answer} done={done.current} onClick={pick} />)}
      </div>
      {done.current && q.explanation && <p style={{ color: tc.textM, fontSize: 12, marginTop: 14, fontStyle: 'italic', fontFamily: "'Outfit',sans-serif" }}>💡 {q.explanation}</p>}
    </div>
  );
}

function ChoiceQ({ q, color, onAnswer }) {
  const [picked, setPicked] = useState(null);
  const [expired, setExpired] = useState(false);
  const done = useRef(false);
  const t0 = useRef(Date.now());
  const lang = useContext(LangCtx);
  const tc = useThemeColors();
  const tx = T[lang];

  const expire = useCallback(() => { if (!done.current) { done.current = true; setExpired(true); setTimeout(() => onAnswer(false, q.timeLimit, true), 700); } }, [onAnswer, q.timeLimit]);
  const pick = v => { if (done.current) return; done.current = true; setPicked(v); setTimeout(() => onAnswer(v === q.answer, Math.round((Date.now() - t0.current) / 1000), false), 700); };

  return (
    <div>
      <Countdown total={q.timeLimit} color={color} onExpire={expire} stopped={done.current} />
      {expired && <p style={{ color: '#EF4444', fontSize: 12, fontWeight: 700, marginBottom: 12, fontFamily: "'JetBrains Mono',monospace" }}>{tx.timesUp}</p>}
      {q.text && <div style={{ background: tc.inputBg, borderRadius: 12, padding: '12px 16px', marginBottom: 16, fontSize: 15, color: tc.textS, letterSpacing: 2.5, lineHeight: 2, border: `1px solid ${tc.inputBorder}`, fontFamily: "'JetBrains Mono',monospace" }}>{q.text}</div>}
      {q.items && <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginBottom: 16 }}>{q.items.map((n, i) => <span key={i} style={{ padding: '6px 12px', background: tc.inputBg, borderRadius: 8, fontSize: 14, color: tc.textS, fontFamily: "'JetBrains Mono',monospace", border: `1px solid ${tc.inputBorder}` }}>{n}</span>)}</div>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {q.choices.map((v, i) => <ChoiceButton key={i} label={v} index={i} picked={picked} answer={q.answer} done={done.current} onClick={pick} />)}
      </div>
      {q.note && done.current && <p style={{ color: tc.textM, fontSize: 12, marginTop: 14, fontStyle: 'italic', fontFamily: "'Outfit',sans-serif" }}>💡 {q.note}</p>}
    </div>
  );
}

function OddQ({ q, color, onAnswer }) {
  const [picked, setPicked] = useState(null);
  const [expired, setExpired] = useState(false);
  const done = useRef(false);
  const t0 = useRef(Date.now());
  const lang = useContext(LangCtx);
  const tc = useThemeColors();
  const tx = T[lang];

  const expire = useCallback(() => { if (!done.current) { done.current = true; setExpired(true); setTimeout(() => onAnswer(false, q.timeLimit, true), 700); } }, [onAnswer, q.timeLimit]);
  const pick = v => { if (done.current) return; done.current = true; setPicked(v); setTimeout(() => onAnswer(v === q.answer, Math.round((Date.now() - t0.current) / 1000), false), 700); };

  return (
    <div>
      <Countdown total={q.timeLimit} color={color} onExpire={expire} stopped={done.current} />
      {expired && <p style={{ color: '#EF4444', fontSize: 12, fontWeight: 700, marginBottom: 12 }}>{tx.timesUp}</p>}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {q.items.map((v, i) => {
          let bg = tc.card, brd = tc.cardBorder, textC = tc.textS;
          if (done.current) {
            if (v === q.answer) { bg = 'rgba(16,185,129,0.12)'; brd = '#10B98155'; textC = '#10B981'; }
            else if (v === picked) { bg = 'rgba(239,68,68,0.12)'; brd = '#EF444455'; textC = '#EF4444'; }
          }
          return <button key={i} className="choice-btn" onClick={() => pick(v)} style={{ padding: '12px 20px', background: bg, border: `1.5px solid ${brd}`, borderRadius: 12, color: textC, fontSize: 14, fontWeight: 600, cursor: done.current ? 'default' : 'pointer', fontFamily: "'Outfit',sans-serif" }}>{v}</button>;
        })}
      </div>
      {done.current && q.explanation && <p style={{ color: tc.textM, fontSize: 12, marginTop: 14, fontStyle: 'italic' }}>💡 {q.explanation}</p>}
    </div>
  );
}

function CountQ({ q, color, onAnswer }) {
  const [val, setVal] = useState('');
  const done = useRef(false);
  const t0 = useRef(Date.now());
  const lang = useContext(LangCtx);
  const tc = useThemeColors();
  const tx = T[lang];

  const submit = useCallback(v => { if (done.current) return; done.current = true; setTimeout(() => onAnswer(v.trim() === q.answer, Math.round((Date.now() - t0.current) / 1000), false), 700); }, [q.answer, onAnswer]);
  const expire = useCallback(() => { if (!done.current) submit(''); }, [submit]);

  return (
    <div>
      <Countdown total={q.timeLimit} color={color} onExpire={expire} stopped={done.current} />
      {q.text && <div style={{ background: tc.inputBg, borderRadius: 12, padding: '12px 16px', marginBottom: 16, fontSize: 15, color: tc.textS, letterSpacing: 2.5, lineHeight: 2, border: `1px solid ${tc.inputBorder}`, fontFamily: "'JetBrains Mono',monospace" }}>{q.text}</div>}
      {q.items && <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginBottom: 16 }}>{q.items.map((n, i) => <span key={i} style={{ padding: '6px 12px', background: tc.inputBg, borderRadius: 8, fontSize: 14, color: tc.textS, fontFamily: "'JetBrains Mono',monospace", border: `1px solid ${tc.inputBorder}` }}>{n}</span>)}</div>}
      <input autoFocus value={val} disabled={done.current}
        onChange={e => setVal(e.target.value.replace(/\D/g, ''))}
        onKeyDown={e => e.key === 'Enter' && val && submit(val)}
        style={{ width: '100%', padding: '14px', fontSize: 24, textAlign: 'center', background: tc.inputBg, border: `2px solid ${val ? `${color}60` : tc.inputBorder}`, borderRadius: 14, color: tc.textP, boxSizing: 'border-box', fontFamily: "'JetBrains Mono',monospace", transition: 'border-color 0.3s' }}
        placeholder={tx.yourAnswer} />
      <Btn onClick={() => submit(val)} disabled={!val || done.current} color={color}>{tx.submit}</Btn>
    </div>
  );
}

/* ══════════════════════════════════════════
   RADAR CHART
   ══════════════════════════════════════════ */
function RadarChart({ sectionScores, sections }) {
  const tc = useThemeColors();
  const cx = 110, cy = 110, r = 80, n = sections.length;
  const angle = i => (Math.PI * 2 * i) / n - Math.PI / 2;
  const pt = (i, pct) => { const a = angle(i), d = (pct / 100) * r; return [cx + Math.cos(a) * d, cy + Math.sin(a) * d]; };
  const outer = i => { const a = angle(i); return [cx + Math.cos(a) * r, cy + Math.sin(a) * r]; };

  return (
    <svg width={220} height={220} viewBox="0 0 220 220" style={{ overflow: 'visible' }}>
      {[25, 50, 75, 100].map(p => <polygon key={p} points={sections.map((_, i) => pt(i, p).join(',')).join(' ')} fill="none" stroke={tc.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'} strokeWidth={1} />)}
      {sections.map((_, i) => { const [x, y] = outer(i); return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke={tc.isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)'} strokeWidth={1} />; })}
      <defs><linearGradient id="radarFill" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#A855F7" stopOpacity="0.25" /><stop offset="100%" stopColor="#00D4FF" stopOpacity="0.15" /></linearGradient></defs>
      <polygon points={sectionScores.map((s, i) => pt(i, Math.round((s.correct / s.total) * 100)).join(',')).join(' ')} fill="url(#radarFill)" stroke="#A855F7" strokeWidth={2} strokeLinejoin="round" />
      {sectionScores.map((s, i) => { const p = Math.round((s.correct / s.total) * 100); const [x, y] = pt(i, p); return <circle key={i} cx={x} cy={y} r={5} fill={sections[i].color} stroke={tc.bg} strokeWidth={2} />; })}
      {sections.map((sec, i) => { const [x, y] = outer(i); const dx = x > cx + 5 ? 12 : x < cx - 5 ? -12 : 0; const dy = y > cy + 5 ? 16 : y < cy - 5 ? -10 : 4; return <text key={i} x={x + dx} y={y + dy} fontSize={16} textAnchor="middle">{sec.icon}</text>; })}
    </svg>
  );
}

/* ══════════════════════════════════════════
   RESULTS SCREEN
   ══════════════════════════════════════════ */
function Results({ sectionScores, sections, elapsed, log, onRestart }) {
  const [tab, setTab] = useState('overview');
  const [barsReady, setBarsReady] = useState(false);
  const lang = useContext(LangCtx);
  const tc = useThemeColors();
  const tx = T[lang];

  useEffect(() => { const t = setTimeout(() => setBarsReady(true), 250); return () => clearTimeout(t); }, []);

  const totalQ = sections.reduce((s, x) => s + x.questions.length, 0);
  const correct = sectionScores.reduce((s, x) => s + x.correct, 0);
  const pct = Math.round((correct / totalQ) * 100);
  const mins = Math.floor(elapsed / 60), secs = elapsed % 60;
  const timeStr = mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;

  const r = calculateResults(log);

  const difStats = [1, 2, 3, 4].map(d => { const qs = log.filter(l => l.difficulty === d); const c = qs.filter(l => l.correct).length; return { d, total: qs.length, correct: c, pct: qs.length ? Math.round((c / qs.length) * 100) : 0 }; });
  const secPcts = sectionScores.map((s, i) => ({ ...sections[i], pct: Math.round((s.correct / s.total) * 100) }));
  const sorted = [...secPcts].sort((a, b) => b.pct - a.pct);
  const strongest = sorted[0];
  const weakest = sorted[sorted.length - 1];
  const timedOut = log.filter(l => l.timedOut).length;
  const expertQs = log.filter(l => l.difficulty === 4);
  const expertAcc = expertQs.length ? Math.round(expertQs.filter(l => l.correct).length / expertQs.length * 100) : 0;

  const insights = [];
  if (strongest.pct >= 80) insights.push({ icon: '💪', text: tx.insightStrong(tx.sectionTitles[strongest.id], strongest.pct), type: 'strength' });
  const perfectSections = secPcts.filter(s => s.pct === 100);
  perfectSections.forEach(s => insights.push({ icon: '⭐', text: tx.insightPerfectSection(tx.sectionTitles[s.id]), type: 'strength' }));
  if (weakest.pct < 60) insights.push({ icon: '🎯', text: tx.insightFocus(tx.sectionTitles[weakest.id], weakest.pct), type: 'focus' });
  if (r.avgTime <= 5) insights.push({ icon: '⚡', text: tx.insightFast, type: 'strength' });
  else if (r.avgTime >= 12) insights.push({ icon: '🐢', text: tx.insightSlow, type: 'focus' });
  if (r.stdDev < 3 && log.length > 5) insights.push({ icon: '🎯', text: tx.insightConsistentSpeed, type: 'strength' });
  if (expertAcc >= 75) insights.push({ icon: '🧠', text: tx.insightExpert(expertAcc), type: 'strength' });
  if (timedOut === 0 && totalQ > 10) insights.push({ icon: '✅', text: tx.insightNoTimeouts, type: 'strength' });
  else if (timedOut > 0) insights.push({ icon: '⏰', text: tx.insightTimeout(timedOut), type: 'focus' });

  const TABS = [tx.overview, tx.bySection, tx.byDifficulty, tx.questionLog];
  const TABIDS = ['overview', 'breakdown', 'difficulty', 'log'];

  return (
    <div style={{ background: tc.bg, minHeight: '100vh', fontFamily: "'Outfit',sans-serif", color: tc.textP, padding: '40px 20px 80px' }}>
      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        <div className="su0" style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 56, marginBottom: 10 }}>{r.gradeEmoji}</div>
          <h1 style={{ fontSize: 30, fontWeight: 900, letterSpacing: -1.5, marginBottom: 6 }}>{tx.report}</h1>
          <p style={{ color: tc.textM, fontSize: 13, fontFamily: "'JetBrains Mono',monospace" }}>{tx.completedIn(timeStr)} · {correct}/{totalQ} {tx.correct.toLowerCase()}</p>
        </div>

        <div className="su1" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 16 }}>
          <div style={{ background: `${r.gradeColor}08`, border: `1.5px solid ${r.gradeColor}30`, borderRadius: 20, padding: '22px 18px', position: 'relative', overflow: 'hidden', textAlign: 'center' }}>
            <div style={{ position: 'absolute', top: -30, right: -30, width: 100, height: 100, borderRadius: '50%', background: `${r.gradeColor}06` }} />
            <div style={{ fontSize: 52, fontWeight: 900, color: r.gradeColor, letterSpacing: -3, lineHeight: 1, textShadow: `0 0 40px ${r.gradeColor}30` }}>{r.composite}</div>
            <div style={{ fontSize: 9, color: tc.textM, letterSpacing: 2.5, margin: '6px 0 3px', fontFamily: "'JetBrains Mono',monospace" }}>{(tx.compositeScore || 'COMPOSITE').toUpperCase()}</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: r.gradeColor }}>{r.gradeKey}</div>
          </div>
          <div style={{ background: tc.card, border: `1px solid ${tc.cardBorder}`, borderRadius: 20, padding: '22px 18px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ fontSize: 9, color: tc.textM, letterSpacing: 2.5, marginBottom: 6, fontFamily: "'JetBrains Mono',monospace" }}>{tx.iqLabel.toUpperCase()}</div>
            <div style={{ fontSize: 34, fontWeight: 900, color: r.gradeColor, letterSpacing: -2, textShadow: `0 0 30px ${r.gradeColor}25` }}>{r.iqRange}</div>
            <div style={{ width: '80%', marginTop: 8 }}><Bar value={barsReady ? r.composite : 0} color={r.gradeColor} h={5} animate /></div>
          </div>
          <div style={{ background: tc.card, border: `1px solid ${tc.cardBorder}`, borderRadius: 20, padding: '22px 18px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ fontSize: 9, color: tc.textM, letterSpacing: 2.5, marginBottom: 6, fontFamily: "'JetBrains Mono',monospace" }}>{(tx.percentileLabel || 'PERCENTILE').toUpperCase()}</div>
            <div style={{ fontSize: 34, fontWeight: 900, color: '#A855F7', letterSpacing: -2 }}>{r.percentile}<span style={{ fontSize: 16, fontWeight: 600 }}>th</span></div>
            <div style={{ width: '80%', marginTop: 8 }}><Bar value={barsReady ? r.percentile : 0} color="#A855F7" h={5} animate /></div>
          </div>
        </div>

        <div className="su2" style={{ background: tc.card, border: `1px solid ${tc.cardBorder}`, borderRadius: 14, padding: '14px 18px', marginBottom: 16, textAlign: 'center' }}>
          <p style={{ fontSize: 13, color: tc.textS, lineHeight: 1.8 }}>{tx.grades[r.gradeKey]}</p>
        </div>

        <div className="su2" style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 8, marginBottom: 16 }}>
          {[{ l: tx.accuracy, v: `${pct}%`, c: r.gradeColor }, { l: tx.avgResponse, v: `${r.avgTime}s`, c: '#A855F7' }, { l: tx.speedLabel || 'Speed', v: `${r.speedPct}%`, c: '#00D4FF' }, { l: tx.timeouts, v: timedOut, c: timedOut > 0 ? '#EF4444' : '#10B981' }, { l: tx.bestDomain, v: strongest.icon, c: strongest.color }].map(({ l, v, c }) =>
            <div key={l} style={{ background: tc.card, border: `1px solid ${tc.cardBorder}`, borderRadius: 14, padding: '14px 8px', textAlign: 'center' }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: c }}>{v}</div>
              <div style={{ fontSize: 9, color: tc.textM, letterSpacing: 1, marginTop: 4, fontFamily: "'JetBrains Mono',monospace" }}>{l}</div>
            </div>
          )}
        </div>

        <div className="su3" style={{ background: tc.card, border: `1px solid ${tc.cardBorder}`, borderRadius: 16, padding: '16px 18px', marginBottom: 16 }}>
          <p style={{ fontSize: 10, color: tc.textM, letterSpacing: 2, marginBottom: 14, fontFamily: "'JetBrains Mono',monospace" }}>{tx.scoreCard.toUpperCase()}</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
            {[{ l: `${tx.correct} ✓`, v: correct, c: '#10B981' }, { l: `${tx.missed} ✗`, v: totalQ - correct, c: '#EF4444' }, { l: tx.total, v: totalQ, c: tc.textS }, { l: tx.weightedScore || 'Weighted', v: `${r.wPct}%`, c: r.gradeColor }, { l: tx.speedBonus || 'Speed +', v: `+${r.speedBonus}`, c: '#00D4FF' }, { l: tx.compositeScore || 'Composite', v: r.composite, c: r.gradeColor }].map(({ l, v, c }) =>
              <div key={l} style={{ background: tc.isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.04)', borderRadius: 12, padding: '12px 14px', textAlign: 'center' }}>
                <div style={{ fontSize: 20, fontWeight: 800, color: c }}>{v}</div>
                <div style={{ fontSize: 10, color: tc.textM, marginTop: 3, fontFamily: "'JetBrains Mono',monospace" }}>{l}</div>
              </div>
            )}
          </div>
        </div>

        <div className="su3" style={{ background: tc.card, border: `1px solid ${tc.cardBorder}`, borderRadius: 12, padding: '10px 16px', marginBottom: 16 }}>
          <p style={{ fontSize: 11, color: tc.textM, lineHeight: 1.7, textAlign: 'center' }}>{tx.iqNote}</p>
        </div>

        {insights.length > 0 && <div className="su3" style={{ display: 'grid', gap: 8, marginBottom: 16 }}>
          {insights.map((ins, i) => <div key={i} style={{ background: ins.type === 'strength' ? 'rgba(16,185,129,0.04)' : 'rgba(239,68,68,0.04)', border: `1px solid ${ins.type === 'strength' ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)'}`, borderRadius: 12, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 }}><span style={{ fontSize: 18 }}>{ins.icon}</span><span style={{ fontSize: 13, color: tc.textS }}>{ins.text}</span></div>)}
        </div>}

        <div className="su4" style={{ display: 'flex', gap: 3, marginBottom: 20, background: tc.isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)', borderRadius: 14, padding: 4, border: `1px solid ${tc.cardBorder}` }}>
          {TABS.map((label, i) => <button key={i} onClick={() => setTab(TABIDS[i])} style={{ flex: 1, padding: '10px 4px', borderRadius: 11, border: 'none', fontSize: 11, fontWeight: 600, cursor: 'pointer', letterSpacing: 0.3, fontFamily: "'Outfit',sans-serif", background: tab === TABIDS[i] ? (tc.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)') : 'transparent', color: tab === TABIDS[i] ? tc.textP : tc.textM, transition: 'all 0.25s' }}>{label}</button>)}
        </div>

        {tab === 'overview' && <div className="fi"><div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', alignItems: 'flex-start', marginBottom: 18 }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}><RadarChart sectionScores={sectionScores} sections={sections} /><p style={{ fontSize: 11, color: tc.textM, marginTop: 4, fontFamily: "'JetBrains Mono',monospace" }}>{tx.perfRadar}</p></div>
          <div style={{ flex: 1, minWidth: 200, display: 'grid', gap: 10 }}>{sections.map((sec, i) => { const s = sectionScores[i]; const p = Math.round((s.correct / s.total) * 100); return <div key={sec.id} style={{ background: tc.card, border: `1px solid ${tc.cardBorder}`, borderRadius: 14, padding: '13px 15px' }}><div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}><div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span style={{ fontSize: 16 }}>{sec.icon}</span><span style={{ fontSize: 12, fontWeight: 600 }}>{tx.sectionTitles[sec.id]}</span></div><span style={{ color: sec.color, fontWeight: 700, fontSize: 12, fontFamily: "'JetBrains Mono',monospace" }}>{p}%</span></div><Bar value={barsReady ? p : 0} color={sec.color} animate /></div>; })}</div>
        </div></div>}

        {tab === 'breakdown' && <div className="fi" style={{ display: 'grid', gap: 14 }}>{sections.map((sec, i) => { const s = sectionScores[i]; const p = Math.round((s.correct / s.total) * 100); const sLogs = log.filter(l => l.sectionId === sec.id); const avgT = sLogs.length ? (Math.round(sLogs.reduce((a, x) => a + x.time, 0) / sLogs.length * 10) / 10) : 0; const tos = sLogs.filter(l => l.timedOut).length; return <div key={sec.id} style={{ background: tc.card, border: `1px solid ${sec.color}22`, borderRadius: 18, padding: '20px 22px' }}><div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}><div style={{ display: 'flex', alignItems: 'center', gap: 12 }}><span style={{ fontSize: 26 }}>{sec.icon}</span><div><div style={{ fontWeight: 700, fontSize: 15 }}>{tx.sectionTitles[sec.id]}</div><div style={{ fontSize: 11, color: tc.textM, marginTop: 3 }}>{tx.sectionDescs[sec.id]}</div></div></div><div style={{ textAlign: 'right' }}><div style={{ fontSize: 28, fontWeight: 900, color: sec.color }}>{p}%</div><div style={{ fontSize: 11, color: tc.textM, fontFamily: "'JetBrains Mono',monospace" }}>{s.correct}/{s.total}</div></div></div><Bar value={barsReady ? p : 0} color={sec.color} h={6} animate /><div style={{ display: 'flex', gap: 24, marginTop: 14 }}>{[{ l: tx.avgTime, v: `${avgT}s` }, { l: tx.timeouts, v: tos }, { l: tx.questions, v: s.total }].map(({ l, v }) => <div key={l}><div style={{ fontSize: 17, fontWeight: 700, color: tc.textS }}>{v}</div><div style={{ fontSize: 10, color: tc.textM, letterSpacing: 0.5, fontFamily: "'JetBrains Mono',monospace" }}>{l}</div></div>)}</div><div style={{ display: 'flex', gap: 5, marginTop: 14, flexWrap: 'wrap' }}>{sLogs.map((l, idx) => <div key={idx} title={`Q${idx + 1}: ${l.correct ? '✓' : '✗'} (${l.time}s)`} style={{ width: 30, height: 30, borderRadius: 9, background: l.correct ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)', border: `1.5px solid ${l.correct ? '#10B981' : '#EF4444'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, color: l.correct ? '#10B981' : '#EF4444' }}>{l.correct ? '✓' : '✗'}</div>)}</div></div>; })}</div>}

        {tab === 'difficulty' && <div className="fi" style={{ display: 'grid', gap: 12 }}>{difStats.map(({ d, total: t, correct: c, pct: p }) => <div key={d} style={{ background: tc.card, border: `1px solid ${DC[d]}22`, borderRadius: 16, padding: '18px 20px' }}><div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}><div style={{ display: 'flex', alignItems: 'center', gap: 12 }}><Badge level={d} lang={lang} /><span style={{ fontSize: 13, color: tc.textM }}>{tx.nQestions(t)}</span></div><div style={{ display: 'flex', alignItems: 'center', gap: 14 }}><span style={{ fontSize: 12, color: tc.textM, fontFamily: "'JetBrains Mono',monospace" }}>{c}/{t}</span><span style={{ fontSize: 22, fontWeight: 800, color: DC[d] }}>{p}%</span></div></div><Bar value={barsReady ? p : 0} color={DC[d]} h={6} animate /></div>)}<div style={{ background: tc.card, border: `1px solid ${tc.cardBorder}`, borderRadius: 14, padding: '16px 18px', marginTop: 4 }}><p style={{ fontSize: 13, color: tc.textS, lineHeight: 1.8 }}><strong style={{ color: tc.textP }}>💡 </strong>{tx.difComment(difStats)}</p></div></div>}

        {tab === 'log' && <div className="fi" style={{ display: 'grid', gap: 8 }}>{log.map((l, i) => { const sec = sections.find(s => s.id === l.sectionId); return <div key={i} style={{ background: tc.card, border: `1px solid ${l.correct ? 'rgba(16,185,129,0.15)' : l.timedOut ? 'rgba(255,100,0,0.15)' : 'rgba(239,68,68,0.15)'}`, borderRadius: 12, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 14 }}><div style={{ width: 30, height: 30, borderRadius: 9, flexShrink: 0, background: l.correct ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', border: `1.5px solid ${l.correct ? '#10B981' : '#EF4444'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, color: l.correct ? '#10B981' : '#EF4444' }}>{l.correct ? '✓' : '✗'}</div><div style={{ flex: 1, minWidth: 0 }}><div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 3 }}><span>{sec?.icon}</span><span style={{ fontSize: 11, color: tc.textM }}>{tx.sectionTitles[l.sectionId]}</span><Badge level={l.difficulty} lang={lang} /></div><p style={{ fontSize: 12, color: tc.textS, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{l.prompt}</p></div><div style={{ textAlign: 'right', flexShrink: 0 }}><div style={{ fontSize: 11, fontWeight: 700, fontFamily: "'JetBrains Mono',monospace", color: l.timedOut ? '#FF6B35' : l.correct ? '#10B981' : '#EF4444' }}>{l.timedOut ? tx.timeout : l.correct ? tx.correct.toUpperCase() : tx.wrong}</div><div style={{ fontSize: 11, color: tc.textM, fontFamily: "'JetBrains Mono',monospace" }}>{l.time}s</div></div></div>; })}</div>}

        <Btn onClick={onRestart} outline color={r.gradeColor}>{tx.retake}</Btn>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   MAIN APP
   ══════════════════════════════════════════ */
export default function App() {
  const [lang, setLang] = useState('tr');
  const [theme, setTheme] = useState('dark');
  const [screen, setScreen] = useState('intro');
  const [sections, setSections] = useState(() => buildSections('tr'));
  const [si, setSi] = useState(0);
  const [qi, setQi] = useState(0);
  const [sectionScores, setSectionScores] = useState(() => buildSections('tr').map(s => ({ correct: 0, total: s.questions.length })));
  const [log, setLog] = useState([]);
  const [fb, setFb] = useState(null);
  const [t0, setT0] = useState(null);
  const [elapsed, setElapsed] = useState(0);
  const [paused, setPaused] = useState(false);
  const fbLock = useRef(false);

  const tx = T[lang];
  const tc = useMemo(() => {
    const isDark = theme === 'dark';
    return {
      isDark, bg: isDark ? '#06080c' : '#f0f2f5',
      card: isDark ? 'rgba(255,255,255,0.025)' : 'rgba(255,255,255,0.85)',
      cardBorder: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.08)',
      textP: isDark ? '#e8eaed' : '#111318',
      textS: isDark ? '#9aa0a8' : '#5f6672',
      textM: isDark ? '#484e58' : '#a0a6b0',
    };
  }, [theme]);

  const sec = sections[si];
  const q = sec?.questions[qi];
  const totalQ = sections.reduce((s, x) => s + x.questions.length, 0);
  const done_q = sections.slice(0, si).reduce((s, x) => s + x.questions.length, 0) + qi;

  const handleAnswer = useCallback((ok, timeTaken, timedOut = false) => {
    if (fbLock.current) return;
    fbLock.current = true;
    setFb(ok ? 'correct' : 'wrong');
    setSectionScores(prev => prev.map((s, i) => i === si ? { ...s, correct: s.correct + (ok ? 1 : 0) } : s));
    setLog(prev => [...prev, { sectionId: sec.id, prompt: q.prompt, difficulty: q.difficulty, correct: ok, time: timeTaken ?? q.timeLimit, timeLimit: q.timeLimit, timedOut }]);
    setTimeout(() => {
      setFb(null);
      fbLock.current = false;
      const nq = qi + 1;
      if (nq < sec.questions.length) { setQi(nq); }
      else {
        const ns = si + 1;
        if (ns < sections.length) { setSi(ns); setQi(0); setScreen('sec-intro'); }
        else { setElapsed(Math.round((Date.now() - t0) / 1000)); setScreen('results'); }
      }
    }, 1100);
  }, [si, qi, sec, q, t0, sections]);

  const renderQ = () => {
    const p = { q, color: sec.color, onAnswer: handleAnswer };
    const k = `${si}-${qi}`;
    if (q.type === 'sequence' || q.type === 'reverse-sequence') return <SequenceQ key={k} {...p} />;
    if (q.type === 'word-recall') return <WordRecallQ key={k} {...p} />;
    if (q.type === 'spatial-grid') return <SpatialGridQ key={k} {...p} />;
    if (q.type === 'story-recall') return <StoryRecallQ key={k} {...p} />;
    if (q.type === 'n-back') return <NBackQ key={k} {...p} />;
    if (q.type === 'matrix') return <MatrixQ key={k} {...p} />;
    if (q.type === 'odd-one-out') return <OddQ key={k} {...p} />;
    if (q.type === 'count' || q.type === 'pattern-count') return <CountQ key={k} {...p} />;
    return <ChoiceQ key={k} {...p} />;
  };

  const startFresh = (newLang = lang) => {
    const ns = buildSections(newLang);
    setSections(ns);
    setSectionScores(ns.map(s => ({ correct: 0, total: s.questions.length })));
    setSi(0); setQi(0); setLog([]); setFb(null); fbLock.current = false; setT0(null); setPaused(false);
  };

  const switchLang = nl => { setLang(nl); if (screen === 'intro') startFresh(nl); };

  const Controls = () => (
    <div style={{ position: 'fixed', top: 18, right: 18, display: 'flex', gap: 8, zIndex: 999 }}>
      {screen === 'question' && (
        <button onClick={() => setPaused(p => !p)} style={{ padding: '7px 16px', borderRadius: 10, fontSize: 12, fontWeight: 700, fontFamily: "'Outfit',sans-serif", transition: 'all 0.25s', border: 'none', background: paused ? sec.color : tc.card, color: paused ? '#000' : tc.textP, boxShadow: paused ? `0 4px 16px ${sec.color}30` : 'none' }}>
          {paused ? '▶ ' + tx.resume : '⏸ ' + tx.pause}
        </button>
      )}
      <button onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')} style={{ padding: '7px 14px', background: tc.card, border: `1px solid ${tc.cardBorder}`, borderRadius: 10, color: tc.textP, fontSize: 12, fontWeight: 600, fontFamily: "'Outfit',sans-serif" }}>{tc.isDark ? '☀️' : '🌙'}</button>
      <button onClick={() => switchLang(lang === 'en' ? 'tr' : 'en')} style={{ padding: '7px 14px', background: tc.card, border: `1px solid ${tc.cardBorder}`, borderRadius: 10, color: tc.textP, fontSize: 12, fontWeight: 600, fontFamily: "'Outfit',sans-serif" }}>{tx.lang}</button>
    </div>
  );

  const wrap = children => (
    <LangCtx.Provider value={lang}>
      <ThemeCtx.Provider value={theme}>
        <PausedCtx.Provider value={paused}>
          <div style={{ background: tc.bg, minHeight: '100vh' }}>
            <Controls />
            {children}
          </div>
        </PausedCtx.Provider>
      </ThemeCtx.Provider>
    </LangCtx.Provider>
  );

  if (screen === 'results') return wrap(
    <Results sectionScores={sectionScores} sections={sections} elapsed={elapsed} log={log} onRestart={() => { startFresh(); setScreen('intro'); }} />
  );

  if (screen === 'intro') return wrap(
    <div style={{ minHeight: '100vh', fontFamily: "'Outfit',sans-serif", color: tc.textP, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px 20px' }}>
      <div style={{ maxWidth: 540, width: '100%', textAlign: 'center' }} className="fi">
        <div style={{ position: 'fixed', top: '20%', left: '50%', transform: 'translateX(-50%)', width: 500, height: 500, borderRadius: '50%', filter: 'blur(120px)', background: 'radial-gradient(circle,rgba(168,85,247,0.08),rgba(0,212,255,0.04),transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>🧠</div>
          <h1 style={{ fontSize: 36, fontWeight: 900, letterSpacing: -2, marginBottom: 12 }}>{tx.title}</h1>
          <p style={{ color: tc.textM, fontSize: 13, lineHeight: 2, marginBottom: 28, fontFamily: "'JetBrains Mono',monospace" }}>{tx.subtitle(totalQ)}</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 22 }}>
            {sections.map(s => <div key={s.id} style={{ background: tc.card, border: `1px solid ${tc.cardBorder}`, borderRadius: 14, padding: '14px 16px', textAlign: 'left' }}><div style={{ fontSize: 20, marginBottom: 6 }}>{s.icon}</div><div style={{ fontWeight: 700, fontSize: 13, marginBottom: 3 }}>{tx.sectionTitles[s.id]}</div><div style={{ color: tc.textM, fontSize: 11, fontFamily: "'JetBrains Mono',monospace" }}>{s.questions.length} q · timed</div></div>)}
          </div>
          <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginBottom: 20, flexWrap: 'wrap' }}>{[1, 2, 3, 4].map(k => <Badge key={k} level={k} lang={lang} />)}</div>
          <div style={{ background: tc.card, border: `1px solid ${tc.cardBorder}`, borderRadius: 14, padding: '14px 18px', marginBottom: 24, textAlign: 'left' }}>
            <p style={{ fontSize: 10, color: tc.textM, letterSpacing: 2, marginBottom: 6, fontFamily: "'JetBrains Mono',monospace" }}>{tx.instrLabel.toUpperCase()}</p>
            <p style={{ fontSize: 13, color: tc.textS || '#999', lineHeight: 1.8 }}>{tx.instructions}</p>
          </div>
          <button onClick={() => { startFresh(); setT0(Date.now()); setScreen('sec-intro'); }} style={{ width: '100%', padding: '16px', border: 'none', borderRadius: 14, fontSize: 16, fontWeight: 800, fontFamily: "'Outfit',sans-serif", letterSpacing: 0.5, background: `linear-gradient(135deg,${tc.textP},${tc.isDark ? '#9aa0a8' : '#333'})`, color: tc.bg, boxShadow: `0 4px 24px ${tc.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.15)'}` }}>{tx.begin} →</button>
        </div>
      </div>
    </div>
  );

  if (screen === 'sec-intro') return wrap(
    <div style={{ minHeight: '100vh', fontFamily: "'Outfit',sans-serif", color: tc.textP, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>
      <div style={{ maxWidth: 460, width: '100%', textAlign: 'center' }} className="fi">
        <div style={{ width: 80, height: 80, borderRadius: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36, margin: '0 auto 24px', background: `${sec.color}0c`, border: `2px solid ${sec.color}30`, boxShadow: `0 0 40px ${sec.color}15` }}>{sec.icon}</div>
        <div style={{ color: sec.color, fontSize: 10, letterSpacing: 3.5, marginBottom: 8, fontWeight: 700, fontFamily: "'JetBrains Mono',monospace" }}>{tx.sectionOf(si + 1, sections.length)}</div>
        <h2 style={{ fontSize: 26, fontWeight: 900, marginBottom: 10 }}>{tx.sectionTitles[sec.id]}</h2>
        <p style={{ color: tc.textM, marginBottom: 6, fontSize: 13 }}>{tx.sectionDescs[sec.id]}</p>
        <p style={{ color: tc.textM, fontSize: 12, marginBottom: 18, fontFamily: "'JetBrains Mono',monospace", opacity: 0.5 }}>{sec.questions.length} {tx.questions.toLowerCase()}</p>
        <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginBottom: 32, flexWrap: 'wrap' }}>{sec.questions.map((x, i) => <Badge key={i} level={x.difficulty} lang={lang} />)}</div>
        <button onClick={() => setScreen('question')} style={{ width: '100%', padding: '15px', border: 'none', borderRadius: 14, fontSize: 15, fontWeight: 700, fontFamily: "'Outfit',sans-serif", background: `linear-gradient(135deg,${sec.color},${sec.color}cc)`, color: '#000', boxShadow: `0 4px 24px ${sec.color}30` }}>{tx.startSection} →</button>
      </div>
    </div>
  );

  // QUESTION SCREEN
  return wrap(
    <div style={{ minHeight: '100vh', fontFamily: "'Outfit',sans-serif", color: tc.textP, padding: '28px 20px' }}>
      <div style={{ maxWidth: 580, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><span style={{ fontSize: 18 }}>{sec.icon}</span><span style={{ fontSize: 12, color: tc.textM, fontFamily: "'JetBrains Mono',monospace" }}>{tx.sectionTitles[sec.id]}</span></div>
          <span style={{ fontSize: 12, color: tc.textM, fontFamily: "'JetBrains Mono',monospace", opacity: 0.4 }}>{tx.qOf(done_q + 1, totalQ)}</span>
        </div>
        <div style={{ marginBottom: 22 }}><Bar value={(done_q / totalQ) * 100} color={sec.color} h={4} /></div>
        <div className="fi" style={{ background: tc.card, border: `1px solid ${tc.cardBorder}`, borderRadius: 22, padding: '24px 24px 28px', position: 'relative', overflow: 'hidden', boxShadow: tc.isDark ? '0 4px 40px rgba(0,0,0,0.3)' : '0 4px 30px rgba(0,0,0,0.05)' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg,${sec.color},${sec.color}00)` }} />
          {fb && <div style={{ position: 'absolute', inset: 0, borderRadius: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 20, background: fb === 'correct' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', backdropFilter: 'blur(2px)' }}><div style={{ width: 72, height: 72, borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', background: fb === 'correct' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)', border: `2px solid ${fb === 'correct' ? '#10B981' : '#EF4444'}50`, fontSize: 36, color: fb === 'correct' ? '#10B981' : '#EF4444' }}>{fb === 'correct' ? '✓' : '✗'}</div></div>}
          {paused && <div onClick={() => setPaused(false)} style={{ position: 'absolute', inset: 0, borderRadius: 22, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, zIndex: 30, background: tc.isDark ? 'rgba(6,8,12,0.94)' : 'rgba(240,242,245,0.95)', cursor: 'pointer', backdropFilter: 'blur(8px)' }}><span style={{ fontSize: 52 }}>⏸</span><span style={{ fontSize: 20, fontWeight: 900, letterSpacing: 3, color: tc.textP }}>{tx.paused}</span><span style={{ fontSize: 12, color: tc.textM, textAlign: 'center', maxWidth: 240, lineHeight: 1.8 }}>{tx.pauseNote}</span><button onClick={e => { e.stopPropagation(); setPaused(false); }} style={{ marginTop: 8, padding: '12px 32px', background: `linear-gradient(135deg,${sec.color},${sec.color}cc)`, color: '#000', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 700, fontFamily: "'Outfit',sans-serif" }}>▶ {tx.resume}</button></div>}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <span style={{ fontSize: 11, color: sec.color, letterSpacing: 2.5, fontWeight: 700, fontFamily: "'JetBrains Mono',monospace" }}>{tx.promptLabel.toUpperCase()} {qi + 1}</span>
            <Badge level={q.difficulty} lang={lang} />
          </div>
          <p style={{ fontSize: 15, lineHeight: 1.75, color: tc.textS || '#999', marginBottom: 22, whiteSpace: 'pre-line' }}>{q.prompt}</p>
          {renderQ()}
        </div>
      </div>
    </div>
  );
}
