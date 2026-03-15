const cards = window.DATABASE || [];
const STORE = "fichas-saber-app-v1";
const state = {
  index: 0,
  answer: {},
  rating: {},
  search: "",
  theme: "Todos",
  grade: "Todos",
  year: "Todos",
  active: null
};
try {
  const saved = JSON.parse(localStorage.getItem(STORE) || "{}");
  if (saved.answer) state.answer = saved.answer;
  if (saved.rating) state.rating = saved.rating;
} catch (e) {}

function save() {
  localStorage.setItem(STORE, JSON.stringify({ answer: state.answer, rating: state.rating }));
}
function escHtml(text) {
  return String(text || "").replace(/[&<>"']/g, m => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));
}
function nl2br(text) {
  return escHtml(text).replace(/\n/g, "<br>");
}
function stripQuestionNumber(text) {
  return String(text || "").replace(/^\s*\d+\.\s*/, "");
}
function uniq(key) {
  return [...new Set(cards.map(c => c[key]))];
}
function renderSelect(id, values, label) {
  const sel = document.getElementById(id);
  sel.innerHTML = "";
  const o0 = document.createElement("option");
  o0.value = "Todos";
  o0.textContent = label;
  sel.appendChild(o0);
  values.forEach(v => {
    const o = document.createElement("option");
    o.value = v;
    o.textContent = v;
    sel.appendChild(o);
  });
}
function filteredCards() {
  return cards.filter(c => {
    const hay = [c.title, c.context, c.theme, c.takeaway, c.analysis, c.stem || ""].join(" ").toLowerCase();
    return (state.theme === "Todos" || c.theme === state.theme) &&
           (state.grade === "Todos" || c.grade === state.grade) &&
           (state.year === "Todos" || String(c.year) === state.year) &&
           (!state.search || hay.includes(state.search.toLowerCase()));
  });
}
function currentSet() {
  const rows = filteredCards();
  if (!rows.length) return [];
  if (state.index > rows.length - 1) state.index = 0;
  return rows;
}
function answerFor(id) { return state.answer[id] || null; }
function ratingFor(id) { return state.rating[id] || null; }
function correctOption(card) { return card.options.find(o => o.correct); }
function statusFor(card) {
  const ans = answerFor(card.id);
  if (!ans) return "pending";
  return ans === correctOption(card).label ? "correct" : "wrong";
}
function clearCurrentViewState() {
  state.active = null;
  if (document.activeElement && typeof document.activeElement.blur === "function") {
    document.activeElement.blur();
  }
}
function renderHeaderStatus(rows) {
  const good = rows.filter(r => statusFor(r) === "correct").length;
  const bad = rows.filter(r => statusFor(r) === "wrong").length;
  const pending = rows.length - good - bad;
  document.getElementById("statusCurrent").textContent = `${rows.length ? state.index + 1 : 0} / ${rows.length}`;
  document.getElementById("statusGood").textContent = `✓ ${good}`;
  document.getElementById("statusBad").textContent = `✕ ${bad}`;
  document.getElementById("statusPending").textContent = `◌ ${pending}`;
}
function render() {
  const rows = currentSet();
  const slide = rows[state.index];
  const title = document.getElementById("title");
  const context = document.getElementById("context");
  const chipTheme = document.getElementById("chipTheme");
  const chipSource = document.getElementById("chipSource");
  const questionPrompt = document.getElementById("questionPrompt");
  const options = document.getElementById("options");
  const feedback = document.getElementById("feedback");
  const resultBadge = document.getElementById("resultBadge");
  const feedbackMain = document.getElementById("feedbackMain");
  const feedbackSide = document.getElementById("feedbackSide");
  const analysis = document.getElementById("analysis");
  const distractors = document.getElementById("distractors");
  const glossary = document.getElementById("glossary");
  const scheme = document.getElementById("scheme");
  const schemeBox = document.getElementById("schemeBox");
  const extra = document.getElementById("extra");
  const rating = document.getElementById("rating");
  const retryBtn = document.getElementById("retryBtn");
  const counter = document.getElementById("counter");
  const dots = document.getElementById("dots");
  const miniList = document.getElementById("miniList");

  renderHeaderStatus(rows);

  if (!slide) {
    title.textContent = "No hay fichas con esos filtros";
    context.textContent = "Ajusta la búsqueda o los filtros en el panel lateral.";
    chipTheme.textContent = "Sin resultados";
    chipSource.textContent = "";
    options.innerHTML = "";
    feedback.classList.remove("visible");
    extra.classList.remove("visible");
    scheme.classList.remove("visible");
    rating.classList.remove("visible");
    counter.textContent = "0 / 0";
    dots.innerHTML = "";
    miniList.innerHTML = "";
    return;
  }

  chipTheme.textContent = slide.theme;
  chipSource.textContent = `${slide.year} · ${slide.grade}° · C${slide.cuad} · P${slide.q}`;
  title.textContent = slide.title;
  context.textContent = slide.context;
  questionPrompt.innerHTML = nl2br(stripQuestionNumber(slide.stem || "Selecciona la opción que mejor resuelve la situación."));

  const activeChoice = state.active && state.active.id === slide.id ? state.active.label : null;
  options.innerHTML = "";
  slide.options.forEach(opt => {
    const btn = document.createElement("button");
    btn.className = "option";
    btn.innerHTML = `<strong>${opt.label}.</strong> ${opt.text}`;
    if (activeChoice) {
      if (opt.correct) btn.classList.add("correct");
      else if (activeChoice === opt.label) btn.classList.add("wrong");
      else btn.classList.add("dimmed");
    }
    btn.onclick = () => {
      state.answer[slide.id] = opt.label;
      state.active = { id: slide.id, label: opt.label };
      save();
      render();
    };
    options.appendChild(btn);
  });

  if (activeChoice) {
    const selected = slide.options.find(o => o.label === activeChoice);
    const correct = correctOption(slide);
    const ok = selected.correct;
    resultBadge.textContent = ok ? "Respuesta acertada" : `Marcaste ${activeChoice} · la correcta era ${correct.label}`;
    resultBadge.className = "result " + (ok ? "good" : "bad");
    feedbackMain.textContent = correct.why;
    feedbackSide.textContent = "Idea clave: " + slide.takeaway;
    feedback.classList.add("visible");
    extra.classList.add("visible");
    scheme.classList.add("visible");
    rating.classList.add("visible");
    analysis.textContent = slide.analysis;
    distractors.textContent = "Por qué fallan las otras opciones: " + slide.distractors;
    retryBtn.onclick = () => {
      delete state.answer[slide.id];
      delete state.rating[slide.id];
      clearCurrentViewState();
      save();
      render();
    };
    glossary.innerHTML = "";
    (slide.glossary || []).forEach(([term, tip]) => {
      const span = document.createElement("span");
      span.className = "term";
      span.textContent = term;
      span.setAttribute("data-tip", tip);
      glossary.appendChild(span);
    });
    if (/<[^>]+>/.test(slide.scheme || "")) {
      schemeBox.innerHTML = slide.scheme;
    } else {
      schemeBox.innerHTML = `<div class="scheme-row">${String(slide.scheme || "").split(/\s*[→↔]\s*/).map((chunk, i, arr) => {
        const safe = chunk.replace(/[&<>"']/g, m => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));
        const arrow = i < arr.length - 1 ? `<span class="scheme-arrow">→</span>` : "";
        return `<span class="scheme-pill">${safe}</span>${arrow}`;
      }).join("")}</div>`;
    }
    [...rating.querySelectorAll("button")].forEach(b => {
      b.className = "";
      const value = ratingFor(slide.id);
      if (value && b.dataset.rate === value) b.classList.add("active-" + value);
      b.onclick = () => {
        state.rating[slide.id] = b.dataset.rate;
        save();
        render();
      };
    });
  } else {
    feedback.classList.remove("visible");
    extra.classList.remove("visible");
    scheme.classList.remove("visible");
    rating.classList.remove("visible");
    retryBtn.onclick = null;
  }

  counter.textContent = `${state.index + 1} / ${rows.length}`;
  dots.innerHTML = "";
  rows.forEach((row, idx) => {
    const dot = document.createElement("button");
    const status = statusFor(row);
    dot.className = `dot ${status}` + (idx === state.index ? " active" : "");
    dot.title = `${idx + 1}. ${row.title} · ${status === "correct" ? "correcta" : status === "wrong" ? "incorrecta" : "pendiente"}`;
    dot.setAttribute("aria-label", dot.title);
    dot.onclick = () => {
      state.index = idx;
      clearCurrentViewState();
      render();
    };
    dots.appendChild(dot);
  });

  miniList.innerHTML = "";
  rows.forEach((row, idx) => {
    const card = document.createElement("div");
    const status = statusFor(row);
    card.className = "mini-card" + (idx === state.index ? " active" : "") + " " + status;
    card.innerHTML = `<strong>${row.title}</strong><div class="meta">${row.theme} · ${row.year} · ${row.grade}° · C${row.cuad} · P${row.q}</div>`;
    card.onclick = () => {
      state.index = idx;
      clearCurrentViewState();
      render();
      document.getElementById("drawer").classList.remove("open");
    };
    miniList.appendChild(card);
  });
}
function smartReview() {
  const rows = currentSet();
  if (!rows.length) return;
  const pool = [];
  rows.forEach((row, idx) => {
    const rate = ratingFor(row.id);
    const status = statusFor(row);
    const weight = status === "wrong" ? 6 : !rate ? 4 : rate === "hard" ? 5 : rate === "ok" ? 3 : 1;
    for (let i = 0; i < weight; i++) pool.push(idx);
  });
  state.index = pool[Math.floor(Math.random() * pool.length)];
  clearCurrentViewState();
  render();
}

document.getElementById("prevBtn").onclick = () => {
  const rows = currentSet();
  if (!rows.length) return;
  state.index = (state.index - 1 + rows.length) % rows.length;
  clearCurrentViewState();
  render();
};
document.getElementById("nextBtn").onclick = () => {
  const rows = currentSet();
  if (!rows.length) return;
  state.index = (state.index + 1) % rows.length;
  clearCurrentViewState();
  render();
};
document.getElementById("smartBtn").onclick = () => { smartReview(); };
document.getElementById("openDrawer").onclick = () => document.getElementById("drawer").classList.add("open");
document.getElementById("closeDrawer").onclick = () => document.getElementById("drawer").classList.remove("open");
document.getElementById("drawer").onclick = (e) => { if (e.target.id === "drawer") e.currentTarget.classList.remove("open"); };

renderSelect("themeFilter", [...new Set(cards.map(c => c.theme))], "Todos los subtemas");
renderSelect("gradeFilter", uniq("grade"), "Todos los grados");
renderSelect("yearFilter", uniq("year"), "Todos los años");
document.getElementById("themeFilter").onchange = e => { state.theme = e.target.value; state.index = 0; clearCurrentViewState(); render(); };
document.getElementById("gradeFilter").onchange = e => { state.grade = e.target.value; state.index = 0; clearCurrentViewState(); render(); };
document.getElementById("yearFilter").onchange = e => { state.year = e.target.value; state.index = 0; clearCurrentViewState(); render(); };
document.getElementById("search").oninput = e => { state.search = e.target.value; state.index = 0; clearCurrentViewState(); render(); };

render();
