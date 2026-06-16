'use client';

// Shared design tokens
const C = {
  bg:       "#0A1628",
  surface:  "#111F35",
  surface2: "#0D1830",
  border:   "rgba(255,255,255,0.08)",
  border2:  "rgba(255,255,255,0.12)",
  blue:     "#185FA5",
  blue2:    "#5B9FD4",
  green:    "#1D9E75",
  amber:    "#F59E0B",
  purple:   "#7C3AED",
  red:      "#D93025",
  text:     "#E8EFF7",
  muted:    "#8BA3C1",
  dim:      "rgba(255,255,255,0.35)",
}

const W = { aspectRatio: "16/9", borderRadius: 14, overflow: "hidden", border: `1px solid ${C.border2}`, fontFamily: "system-ui, sans-serif" }

const chip = (label, bg, color, border) => (
  <span key={label} style={{ background: bg, color, border: `1px solid ${border}`, borderRadius: 9999, padding: "2px 9px", fontSize: 11, fontWeight: 600, whiteSpace: "nowrap" }}>{label}</span>
)

// ─── RESUME BUILDER ───────────────────────────────────────────────────────────

export function ResumeEditor() {
  return (
    <div style={{ ...W, background: C.bg, display: "flex" }}>
      {/* Resume canvas */}
      <div style={{ flex: 1, background: "#EDF2F9", padding: "20px 18px", overflow: "hidden" }}>
        <div style={{ background: "white", borderRadius: 8, height: "100%", padding: "18px 20px", boxShadow: "0 4px 20px rgba(0,0,0,0.10)", overflow: "hidden" }}>
          <div style={{ background: "linear-gradient(135deg, #185FA5, #5B9FD4)", margin: "-18px -20px 14px", padding: "14px 20px" }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: "white" }}>Alex Johnson</div>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.80)" }}>Senior React Developer · Chennai, India</div>
          </div>
          <div style={{ fontSize: 10, fontWeight: 700, color: "#185FA5", textTransform: "uppercase", letterSpacing: "0.06em", borderBottom: "2px solid #185FA5", paddingBottom: 2, marginBottom: 8 }}>Experience</div>
          {[
            { role: "Senior React Developer", co: "Razorpay", period: "2022–Present", bullets: ["Built component library used by 40+ engineers", "Led migration to TypeScript, reducing bugs by 32%"] },
            { role: "Frontend Engineer", co: "Freshworks", period: "2019–2022", bullets: ["Owned customer portal UI serving 12K+ daily users"] },
          ].map((e, i) => (
            <div key={e.co} style={{ marginBottom: 10, padding: i === 0 ? "6px 8px" : 0, background: i === 0 ? "#EBF4FF" : "transparent", border: i === 0 ? "1.5px solid #185FA5" : "none", borderRadius: 6 }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: "#1F2937" }}>{e.role}</span>
                <span style={{ fontSize: 10, color: "#9CA3AF" }}>{e.period}</span>
              </div>
              <div style={{ fontSize: 10, color: "#185FA5", marginBottom: 3 }}>{e.co}</div>
              {e.bullets.map(b => <div key={b} style={{ fontSize: 10, color: "#6B7280" }}>• {b}</div>)}
            </div>
          ))}
        </div>
      </div>
      {/* Edit panel */}
      <div style={{ width: 210, background: C.surface, borderLeft: `1px solid ${C.border}`, padding: "16px 14px", flexShrink: 0 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: C.dim, letterSpacing: "0.08em", marginBottom: 12 }}>EDITING: EXPERIENCE</div>
        {[["Job Title", "Senior React Developer"], ["Company", "Razorpay"], ["Duration", "2022 – Present"]].map(([l, v]) => (
          <div key={l} style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 10, color: C.muted, marginBottom: 3 }}>{l}</div>
            <div style={{ background: C.surface2, border: `1px solid ${C.blue}60`, borderRadius: 7, padding: "6px 8px", fontSize: 11, color: C.text }}>{v}</div>
          </div>
        ))}
        <div style={{ marginBottom: 10 }}>
          <div style={{ fontSize: 10, color: C.muted, marginBottom: 3 }}>Bullet points</div>
          <div style={{ background: C.surface2, border: `1px solid ${C.border2}`, borderRadius: 7, padding: "6px 8px", fontSize: 11, color: C.muted, height: 50 }}>
            • Built component library...
          </div>
        </div>
        <div style={{ background: `${C.blue}20`, border: `1px solid ${C.blue}40`, borderRadius: 8, padding: "8px 10px", marginTop: 8 }}>
          <div style={{ fontSize: 10, color: C.blue2, fontWeight: 700, marginBottom: 3 }}>✦ AI SUGGESTION</div>
          <div style={{ fontSize: 10, color: C.muted, lineHeight: 1.5 }}>Add a metric — "used by 40+ engineers" is stronger than "used by engineers".</div>
        </div>
      </div>
    </div>
  )
}

export function ResumeATS() {
  const matched = ["React", "TypeScript", "REST APIs", "Git", "Agile"]
  const missing = ["GraphQL", "AWS", "CI/CD", "Docker"]
  return (
    <div style={{ ...W, background: C.bg, display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "12px 20px", borderBottom: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>ATS Score Check</div>
        <div style={{ fontSize: 11, color: C.muted }}>Senior Full Stack Developer · Swiggy</div>
      </div>
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        {/* JD panel */}
        <div style={{ width: "42%", borderRight: `1px solid ${C.border}`, padding: "16px", flexShrink: 0, overflow: "hidden" }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: C.dim, letterSpacing: "0.06em", marginBottom: 8 }}>JOB DESCRIPTION</div>
          <div style={{ background: C.surface2, border: `1px solid ${C.border2}`, borderRadius: 10, padding: "10px 12px", fontSize: 10, color: C.muted, lineHeight: 1.7, height: "calc(100% - 30px)", overflow: "hidden" }}>
            <div style={{ fontWeight: 700, color: C.text, marginBottom: 4 }}>Senior Full Stack Developer</div>
            <div>We're looking for a Full Stack developer with strong React and GraphQL experience. You'll work on AWS-hosted services, build CI/CD pipelines, and collaborate in an Agile team...</div>
            <div style={{ marginTop: 8 }}>Required: React, TypeScript, GraphQL, AWS, Docker, CI/CD, REST APIs, Git</div>
          </div>
        </div>
        {/* Score panel */}
        <div style={{ flex: 1, padding: "16px 20px", display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ position: "relative", width: 72, height: 72, flexShrink: 0 }}>
              <svg viewBox="0 0 72 72" style={{ width: 72, height: 72, transform: "rotate(-90deg)" }}>
                <circle cx="36" cy="36" r="28" fill="none" stroke={`${C.amber}25`} strokeWidth="7" />
                <circle cx="36" cy="36" r="28" fill="none" stroke={C.amber} strokeWidth="7"
                  strokeDasharray={`${2*Math.PI*28*0.62} ${2*Math.PI*28}`} strokeLinecap="round" />
              </svg>
              <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                <div style={{ fontSize: 16, fontWeight: 800, color: C.amber }}>62%</div>
                <div style={{ fontSize: 8, color: C.muted }}>match</div>
              </div>
            </div>
            <div>
              <div style={{ background: `${C.amber}15`, border: `1px solid ${C.amber}30`, borderRadius: 8, padding: "6px 10px" }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#F5A623" }}>Partial Match</div>
                <div style={{ fontSize: 10, color: C.muted }}>4 key keywords missing</div>
              </div>
            </div>
          </div>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: C.dim, letterSpacing: "0.06em", marginBottom: 5 }}>✓ MATCHED ({matched.length})</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>{matched.map(k => chip(k, `${C.green}20`, C.green, `${C.green}40`))}</div>
          </div>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: C.dim, letterSpacing: "0.06em", marginBottom: 5 }}>✗ MISSING ({missing.length})</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>{missing.map(k => chip(k, `${C.red}15`, "#F87171", `${C.red}30`))}</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export function ResumeExport() {
  return (
    <div style={{ ...W, background: C.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: C.surface, border: `1px solid ${C.border2}`, borderRadius: 16, padding: "28px 32px", width: 380, boxShadow: "0 30px 80px rgba(0,0,0,0.50)" }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: C.text, marginBottom: 4 }}>Export Resume</div>
        <div style={{ fontSize: 11, color: C.muted, marginBottom: 20 }}>Choose a format to download</div>
        <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
          {[
            { fmt: "PDF", desc: "Best for applying", icon: "📄", sel: true },
            { fmt: "Word", desc: "Editable DOCX",    icon: "📝", sel: false },
          ].map(f => (
            <div key={f.fmt} style={{
              flex: 1, background: f.sel ? `${C.blue}20` : C.surface2,
              border: `2px solid ${f.sel ? C.blue : C.border}`, borderRadius: 12,
              padding: "14px", textAlign: "center", cursor: "pointer",
            }}>
              <div style={{ fontSize: 24, marginBottom: 4 }}>{f.icon}</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: f.sel ? C.blue2 : C.text }}>{f.fmt}</div>
              <div style={{ fontSize: 10, color: C.muted }}>{f.desc}</div>
            </div>
          ))}
        </div>
        {[["Include photo", true], ["ATS-safe formatting", true], ["Include hyperlinks", false]].map(([label, on]) => (
          <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <span style={{ fontSize: 12, color: C.muted }}>{label}</span>
            <div style={{ width: 36, height: 20, borderRadius: 10, background: on ? C.green : C.surface2, border: `1px solid ${on ? C.green : C.border}`, position: "relative" }}>
              <div style={{ position: "absolute", top: 2, left: on ? 18 : 2, width: 14, height: 14, borderRadius: "50%", background: "white", transition: "left 0.2s" }} />
            </div>
          </div>
        ))}
        <div style={{ background: C.blue, borderRadius: 10, padding: "11px", textAlign: "center", marginTop: 14, fontSize: 13, fontWeight: 600, color: "white" }}>
          Download PDF
        </div>
        <div style={{ textAlign: "center", marginTop: 10, fontSize: 11, color: C.muted }}>
          Or share a public link →&nbsp;<span style={{ color: C.blue2 }}>proflect.app/r/alex-johnson</span>
        </div>
      </div>
    </div>
  )
}

// ─── PORTFOLIO ────────────────────────────────────────────────────────────────

export function PortfolioEditor() {
  return (
    <div style={{ ...W, background: C.bg, display: "flex" }}>
      {/* Project list */}
      <div style={{ width: 200, background: C.surface2, borderRight: `1px solid ${C.border}`, padding: "14px 10px", flexShrink: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: C.text }}>Projects</span>
          <div style={{ background: C.blue, borderRadius: 6, padding: "3px 8px", fontSize: 11, fontWeight: 600, color: "white" }}>+ Add</div>
        </div>
        {["PayFlow Dashboard", "CareerMap AI", "Inventory Pro"].map((p, i) => (
          <div key={p} style={{ padding: "8px 10px", borderRadius: 8, marginBottom: 4, background: i === 0 ? `${C.blue}20` : "transparent", border: i === 0 ? `1px solid ${C.blue}40` : "1px solid transparent", fontSize: 12, color: i === 0 ? C.blue2 : C.muted }}>
            📁 {p}
          </div>
        ))}
        <div style={{ marginTop: 14, padding: "8px 10px", borderRadius: 8, border: `1px dashed ${C.border2}`, fontSize: 11, color: C.dim, textAlign: "center" }}>+ New project</div>
      </div>
      {/* Edit form */}
      <div style={{ flex: 1, padding: "18px 22px", overflow: "hidden" }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 16 }}>Editing: PayFlow Dashboard</div>
        {[["Project title", "PayFlow Dashboard"], ["Short description", "Real-time payment analytics for 50K+ merchants"]].map(([l, v]) => (
          <div key={l} style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 10, color: C.muted, marginBottom: 4 }}>{l}</div>
            <div style={{ background: C.surface2, border: `1px solid ${C.border2}`, borderRadius: 8, padding: "8px 10px", fontSize: 12, color: C.text }}>{v}</div>
          </div>
        ))}
        <div style={{ marginBottom: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
            <span style={{ fontSize: 10, color: C.muted }}>Full description</span>
            <div style={{ background: `${C.purple}20`, border: `1px solid ${C.purple}40`, borderRadius: 6, padding: "2px 8px", fontSize: 10, fontWeight: 600, color: "#A78BFA" }}>✦ Write with AI</div>
          </div>
          <div style={{ background: C.surface2, border: `1px solid ${C.border2}`, borderRadius: 8, padding: "8px 10px", fontSize: 11, color: C.muted, height: 52, overflow: "hidden" }}>
            A full-stack analytics dashboard built with React and D3.js. Features real-time WebSocket updates, role-based access, and CSV export...
          </div>
        </div>
        <div>
          <div style={{ fontSize: 10, color: C.muted, marginBottom: 6 }}>Tech tags</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
            {["React", "D3.js", "WebSockets", "Node.js"].map(t => chip(t, `${C.blue}20`, C.blue2, `${C.blue}40`))}
            <span style={{ fontSize: 11, color: C.dim, padding: "2px 8px" }}>+ Add</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export function PortfolioThemes() {
  const themes = [
    { name: "Midnight", color: C.blue,   active: true  },
    { name: "Forest",   color: C.green,  active: false },
    { name: "Violet",   color: C.purple, active: false },
    { name: "Amber",    color: C.amber,  active: false },
  ]
  return (
    <div style={{ ...W, background: C.bg, display: "flex" }}>
      {/* Theme picker */}
      <div style={{ width: 190, background: C.surface2, borderRight: `1px solid ${C.border}`, padding: "14px 12px", flexShrink: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: C.text, marginBottom: 14 }}>Choose Theme</div>
        {themes.map(t => (
          <div key={t.name} style={{ padding: "10px 10px", borderRadius: 10, marginBottom: 6, background: t.active ? `${t.color}20` : "transparent", border: `${t.active ? "2px" : "1px"} solid ${t.active ? t.color : C.border}`, cursor: "pointer", display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: `linear-gradient(135deg, ${t.color}, ${t.color}80)` }} />
            <div>
              <div style={{ fontSize: 12, fontWeight: t.active ? 700 : 400, color: t.active ? C.text : C.muted }}>{t.name}</div>
              {t.active && <div style={{ fontSize: 10, color: t.color }}>Selected</div>}
            </div>
          </div>
        ))}
        <div style={{ marginTop: 14, fontSize: 10, fontWeight: 700, color: C.dim, letterSpacing: "0.08em", marginBottom: 8 }}>LAYOUT</div>
        {["Grid (2 col)", "List", "Masonry"].map((l, i) => (
          <div key={l} style={{ padding: "6px 8px", borderRadius: 7, marginBottom: 3, background: i === 0 ? `${C.blue}15` : "transparent", fontSize: 11, color: i === 0 ? C.blue2 : C.muted }}>{l}</div>
        ))}
      </div>
      {/* Preview */}
      <div style={{ flex: 1, overflow: "hidden", background: "#080F1A" }}>
        <div style={{ height: "100%", background: "linear-gradient(160deg, #0A1628, #0D2137)", padding: "20px 24px", overflow: "hidden" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16, paddingBottom: 14, borderBottom: `1px solid ${C.border}` }}>
            <div style={{ width: 40, height: 40, borderRadius: "50%", background: `linear-gradient(135deg, ${C.blue}, ${C.green})`, display: "grid", placeItems: "center", fontSize: 16, fontWeight: 800, color: "white" }}>A</div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 800, color: "white" }}>Alex Johnson</div>
              <div style={{ fontSize: 11, color: C.muted }}>Senior React Developer</div>
            </div>
            <div style={{ marginLeft: "auto", background: C.blue, borderRadius: 8, padding: "5px 12px", fontSize: 11, fontWeight: 600, color: "white" }}>Hire me</div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {[
              { name: "PayFlow Dashboard", color: C.blue  },
              { name: "CareerMap AI",      color: C.green },
            ].map(p => (
              <div key={p.name} style={{ background: C.surface, border: `1px solid ${C.border2}`, borderRadius: 10, overflow: "hidden" }}>
                <div style={{ height: 52, background: `linear-gradient(135deg, ${p.color}40, ${p.color}10)`, display: "grid", placeItems: "center", fontSize: 18 }}>🚀</div>
                <div style={{ padding: "10px 12px" }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: C.text }}>{p.name}</div>
                  <div style={{ fontSize: 10, color: C.muted, marginTop: 2 }}>React · Node.js · PostgreSQL</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export function PortfolioPublic() {
  return (
    <div style={{ ...W, background: "#080F1A", display: "flex", flexDirection: "column" }}>
      {/* Browser bar */}
      <div style={{ background: "#0D1117", borderBottom: `1px solid ${C.border}`, padding: "8px 16px", display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ display: "flex", gap: 5 }}>{["#FF5F56","#FFBD2E","#27C93F"].map(c => <div key={c} style={{ width: 10, height: 10, borderRadius: "50%", background: c }} />)}</div>
        <div style={{ flex: 1, background: C.surface2, borderRadius: 6, padding: "4px 12px", fontSize: 11, color: C.muted, display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ color: C.green }}>🔒</span> proflect.app/alex-johnson
        </div>
        <div style={{ background: `${C.green}20`, border: `1px solid ${C.green}40`, borderRadius: 6, padding: "3px 10px", fontSize: 10, color: C.green, fontWeight: 600 }}>Share link</div>
      </div>
      {/* Portfolio page */}
      <div style={{ flex: 1, overflow: "hidden", background: "linear-gradient(160deg, #0A1628, #0D2137)", padding: "20px 24px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 18, paddingBottom: 16, borderBottom: `1px solid ${C.border}` }}>
          <div style={{ width: 48, height: 48, borderRadius: "50%", background: `linear-gradient(135deg, ${C.blue}, ${C.green})`, display: "grid", placeItems: "center", fontSize: 20, fontWeight: 800, color: "white", flexShrink: 0 }}>A</div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800, color: "white" }}>Alex Johnson</div>
            <div style={{ fontSize: 12, color: C.muted }}>Senior React Developer · Building delightful UIs</div>
            <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
              {chip("React", `${C.blue}25`, C.blue2, `${C.blue}40`)}
              {chip("TypeScript", `${C.green}20`, C.green, `${C.green}40`)}
              {chip("Node.js", `${C.purple}20`, "#A78BFA", `${C.purple}40`)}
            </div>
          </div>
        </div>
        <div style={{ fontSize: 12, fontWeight: 700, color: C.text, marginBottom: 12 }}>Featured Projects</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
          {[
            { name: "PayFlow Dashboard", tags: ["React", "D3.js"], color: C.blue  },
            { name: "CareerMap AI",      tags: ["Next.js", "AI"],  color: C.green },
            { name: "Inventory Pro",     tags: ["Vue", "GraphQL"], color: C.purple },
          ].map(p => (
            <div key={p.name} style={{ background: C.surface, border: `1px solid ${C.border2}`, borderRadius: 10, overflow: "hidden" }}>
              <div style={{ height: 42, background: `linear-gradient(135deg, ${p.color}40, ${p.color}10)`, display: "grid", placeItems: "center", fontSize: 16 }}>🚀</div>
              <div style={{ padding: "8px 10px" }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: C.text }}>{p.name}</div>
                <div style={{ display: "flex", gap: 3, marginTop: 4 }}>{p.tags.map(t => <span key={t} style={{ fontSize: 9, color: C.dim, background: C.surface2, borderRadius: 4, padding: "1px 5px" }}>{t}</span>)}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── CAREER MAP ───────────────────────────────────────────────────────────────

export function CareerMapUpload() {
  return (
    <div style={{ ...W, background: C.bg, display: "flex" }}>
      {/* Upload zone */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px", borderRight: `1px solid ${C.border}` }}>
        <div style={{ border: `2px dashed ${C.green}50`, borderRadius: 16, padding: "32px 40px", textAlign: "center", background: `${C.green}08` }}>
          <div style={{ fontSize: 36, marginBottom: 10 }}>📄</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 6 }}>Drop your resume here</div>
          <div style={{ fontSize: 12, color: C.muted, marginBottom: 14 }}>PDF or Word · max 10 MB</div>
          <div style={{ background: C.green, borderRadius: 9, padding: "8px 20px", fontSize: 12, fontWeight: 600, color: "white", display: "inline-block" }}>Browse files</div>
        </div>
        <div style={{ marginTop: 14, padding: "8px 16px", background: `${C.green}15`, border: `1px solid ${C.green}30`, borderRadius: 10, display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: C.green }} />
          <span style={{ fontSize: 11, color: C.green }}>alex_resume_2026.pdf — extracting skills...</span>
        </div>
      </div>
      {/* Extracted profile */}
      <div style={{ width: 230, background: C.surface2, padding: "16px 14px", flexShrink: 0 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: C.dim, letterSpacing: "0.08em", marginBottom: 12 }}>EXTRACTED PROFILE</div>
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 10, color: C.muted, marginBottom: 4 }}>Current role</div>
          <div style={{ fontSize: 12, fontWeight: 600, color: C.text }}>Senior React Developer</div>
        </div>
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 10, color: C.muted, marginBottom: 4 }}>Domain</div>
          <div style={{ fontSize: 12, color: C.text }}>Frontend / Full Stack</div>
        </div>
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 10, color: C.muted, marginBottom: 6 }}>Key skills detected</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
            {["React", "TypeScript", "Node.js", "REST APIs", "AWS", "Git"].map(s => chip(s, `${C.green}15`, C.green, `${C.green}30`))}
          </div>
        </div>
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 10, color: C.muted, marginBottom: 4 }}>Seniority signal</div>
          <div style={{ fontSize: 12, color: C.text }}>6 yrs · led teams of 8</div>
        </div>
        <div style={{ background: C.green, borderRadius: 9, padding: "8px 0", textAlign: "center", fontSize: 12, fontWeight: 600, color: "white", marginTop: 8 }}>Build my Career Map →</div>
      </div>
    </div>
  )
}

export function CareerMapGraph() {
  const nodes = [
    { x: 110, y: 180, label: "Senior React\nDeveloper", current: true },
    { x: 290, y: 80,  label: "Engineering\nManager",    type: "vertical"    },
    { x: 290, y: 180, label: "Full Stack\nArchitect",   type: "vertical"    },
    { x: 290, y: 280, label: "Product\nEngineer",       type: "horizontal"  },
    { x: 470, y: 80,  label: "VP\nEngineering",          type: "vertical"    },
    { x: 470, y: 280, label: "Technical\nProduct Mgr",  type: "diagonal"    },
  ]
  const edges = [[110,180,290,80],[110,180,290,180],[110,180,290,280],[290,80,470,80],[290,280,470,280]]
  const typeColor = { vertical: C.blue, horizontal: C.green, diagonal: C.amber }
  return (
    <div style={{ ...W, background: C.bg, display: "flex" }}>
      {/* Sidebar */}
      <div style={{ width: 190, background: C.surface2, borderRight: `1px solid ${C.border}`, padding: "14px 12px", flexShrink: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: C.text, marginBottom: 4 }}>Career Map</div>
        <div style={{ fontSize: 10, color: C.muted, marginBottom: 14 }}>6 paths · click to explore</div>
        {[["Vertical growth",2,C.blue],["Horizontal pivot",2,C.green],["Diagonal leap",2,C.amber]].map(([l,n,c]) => (
          <div key={l} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ width: 8, height: 8, borderRadius: 2, background: c }} />
              <span style={{ fontSize: 11, color: C.muted }}>{l}</span>
            </div>
            <span style={{ fontSize: 11, fontWeight: 700, color: C.text }}>{n}</span>
          </div>
        ))}
        <div style={{ marginTop: 16, padding: "10px", background: `${C.blue}15`, border: `1px solid ${C.blue}30`, borderRadius: 10 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: C.blue2, marginBottom: 3 }}>SELECTED</div>
          <div style={{ fontSize: 12, fontWeight: 700, color: C.text }}>Engineering Manager</div>
          <div style={{ fontSize: 10, color: C.muted, marginTop: 2 }}>~18 months · 3 skills gap</div>
          <div style={{ marginTop: 8, background: C.blue, borderRadius: 7, padding: "6px 0", textAlign: "center", fontSize: 11, fontWeight: 600, color: "white" }}>View study plan</div>
        </div>
      </div>
      {/* Graph */}
      <div style={{ flex: 1, position: "relative" }}>
        <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} viewBox="0 0 580 380">
          {edges.map(([x1,y1,x2,y2],i) => <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="rgba(255,255,255,0.12)" strokeWidth={1.5} strokeDasharray="4 4" />)}
          {nodes.map(n => (
            <g key={n.label} transform={`translate(${n.x},${n.y})`}>
              <circle r={36} fill={n.current ? C.blue : C.surface} stroke={n.current ? C.blue2 : (typeColor[n.type] || C.border2)} strokeWidth={n.current ? 3 : 1.5} />
              {n.current && <circle r={42} fill="none" stroke={`${C.blue}40`} strokeWidth={8} />}
              {n.label.split("\n").map((line,li) => <text key={li} x={0} y={li*13-5} textAnchor="middle" fill={n.current ? "white" : C.text} fontSize={9} fontWeight={n.current ? 700 : 500}>{line}</text>)}
            </g>
          ))}
        </svg>
        <div style={{ position: "absolute", bottom: 12, right: 12, display: "flex", gap: 10 }}>
          {[["#185FA5","Vertical"],["#1D9E75","Horizontal"],["#F59E0B","Diagonal"]].map(([c,l]) => (
            <div key={l} style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <div style={{ width: 8, height: 8, borderRadius: 2, background: c }} />
              <span style={{ fontSize: 10, color: C.muted }}>{l}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export function CareerMapStudyPlan() {
  const topics = [
    { t: "People Management Foundations",   done: true  },
    { t: "1:1s, Feedback & Performance",    done: true  },
    { t: "Technical Leadership",            done: false, active: true },
    { t: "Hiring & Team Building",          done: false },
    { t: "Engineering Strategy",            done: false },
    { t: "Stakeholder Communication",       done: false },
  ]
  return (
    <div style={{ ...W, background: C.bg, display: "flex" }}>
      {/* Sidebar */}
      <div style={{ width: 210, background: C.surface2, borderRight: `1px solid ${C.border}`, padding: "14px 12px", flexShrink: 0 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: C.text, marginBottom: 2 }}>Engineering Manager</div>
        <div style={{ fontSize: 10, color: C.muted, marginBottom: 10 }}>Study plan · 6 topics</div>
        <div style={{ background: C.surface, borderRadius: 9999, height: 4, marginBottom: 14 }}>
          <div style={{ width: "33%", height: "100%", background: `linear-gradient(90deg, ${C.green}, ${C.blue})`, borderRadius: 9999 }} />
        </div>
        {topics.map(t => (
          <div key={t.t} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 8px", borderRadius: 8, marginBottom: 3, background: t.active ? `${C.blue}20` : "transparent", border: t.active ? `1px solid ${C.blue}40` : "1px solid transparent" }}>
            <div style={{ width: 14, height: 14, borderRadius: "50%", flexShrink: 0, background: t.done ? C.green : t.active ? C.blue : C.surface, border: `1.5px solid ${t.done ? C.green : t.active ? C.blue : C.border2}`, display: "grid", placeItems: "center", fontSize: 8, color: "white" }}>{t.done ? "✓" : ""}</div>
            <span style={{ fontSize: 11, color: t.active ? C.blue2 : t.done ? C.muted : C.text }}>{t.t}</span>
          </div>
        ))}
      </div>
      {/* Content */}
      <div style={{ flex: 1, padding: "20px 24px", overflow: "hidden" }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 4 }}>Technical Leadership</div>
        <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
          {chip("Concept", `${C.blue}20`, C.blue2, `${C.blue}40`)}
          {chip("~25 min", C.surface2, C.muted, C.border)}
        </div>
        <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.7, marginBottom: 14 }}>
          Technical leadership is the ability to guide engineering decisions while still enabling your team. As an EM, you're no longer the best coder — you're the person who makes 10 engineers more effective.
        </div>
        <div style={{ background: C.surface2, border: `1px solid ${C.border2}`, borderRadius: 10, padding: "10px 14px", marginBottom: 12 }}>
          <div style={{ fontSize: 10, color: C.dim, marginBottom: 4 }}>SOURCE · engineering-management.dev</div>
          <div style={{ fontSize: 11, color: C.muted, fontStyle: "italic" }}>
            "The best technical leaders are not the ones writing the most code, but the ones removing obstacles for their teams."
          </div>
        </div>
        <div style={{ background: `${C.amber}15`, border: `1px solid ${C.amber}30`, borderLeft: `4px solid ${C.amber}`, borderRadius: "0 8px 8px 0", padding: "8px 12px" }}>
          <span style={{ fontSize: 11, color: C.text }}>📹 Video: "How to Lead Without Authority" — 14 min</span>
        </div>
      </div>
    </div>
  )
}

// ─── COURSES ──────────────────────────────────────────────────────────────────

export function CoursesStructure() {
  return (
    <div style={{ ...W, background: C.bg, display: "flex" }}>
      {/* Course list */}
      <div style={{ width: 195, background: C.surface2, borderRight: `1px solid ${C.border}`, padding: "14px 10px", flexShrink: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: C.text, marginBottom: 14 }}>My Courses</div>
        {[
          { name: "React Fundamentals", pct: 38, active: true  },
          { name: "SQL Mastery",        pct: 72, active: false },
          { name: "System Design",      pct: 10, active: false },
        ].map(c => (
          <div key={c.name} style={{ padding: "9px 10px", borderRadius: 10, marginBottom: 6, background: c.active ? `${C.blue}20` : "transparent", border: c.active ? `1px solid ${C.blue}40` : "1px solid transparent" }}>
            <div style={{ fontSize: 12, color: c.active ? C.blue2 : C.muted, marginBottom: 5 }}>{c.name}</div>
            <div style={{ background: C.surface, borderRadius: 9999, height: 4 }}>
              <div style={{ width: `${c.pct}%`, height: "100%", background: c.active ? C.blue : C.green, borderRadius: 9999 }} />
            </div>
            <div style={{ fontSize: 10, color: C.dim, marginTop: 3 }}>{c.pct}% complete</div>
          </div>
        ))}
      </div>
      {/* Phase structure */}
      <div style={{ flex: 1, padding: "18px 22px", overflow: "hidden" }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 4 }}>React Fundamentals</div>
        <div style={{ fontSize: 11, color: C.muted, marginBottom: 16 }}>3 phases · 8 topics · 42 sections</div>
        {[
          { phase: "Phase 1 — Beginner",      open: true,  topics: ["JSX & Components", "Props & State", "Event Handling"], done: 3, total: 3 },
          { phase: "Phase 2 — Intermediate",  open: true,  topics: ["Hooks Deep Dive", "Context & Reducers", "Data Fetching"], done: 1, total: 3 },
          { phase: "Phase 3 — Advanced",      open: false, topics: [], done: 0, total: 2 },
        ].map(p => (
          <div key={p.phase} style={{ marginBottom: 10, background: C.surface, border: `1px solid ${C.border2}`, borderRadius: 12, overflow: "hidden" }}>
            <div style={{ padding: "10px 14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: C.text }}>{p.phase}</span>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 10, color: p.done === p.total ? C.green : C.muted }}>{p.done}/{p.total} topics</span>
                <span style={{ fontSize: 12, color: C.dim }}>{p.open ? "▾" : "▸"}</span>
              </div>
            </div>
            {p.open && p.topics.length > 0 && (
              <div style={{ borderTop: `1px solid ${C.border}`, padding: "8px 14px" }}>
                {p.topics.map((t, i) => (
                  <div key={t} style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 0" }}>
                    <div style={{ width: 12, height: 12, borderRadius: "50%", flexShrink: 0, background: i < p.done ? C.green : C.surface2, border: `1.5px solid ${i < p.done ? C.green : C.border2}`, display: "grid", placeItems: "center", fontSize: 7, color: "white" }}>{i < p.done ? "✓" : ""}</div>
                    <span style={{ fontSize: 11, color: i < p.done ? C.muted : C.text }}>{t}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export function CoursesContent() {
  return (
    <div style={{ ...W, background: C.bg, display: "flex" }}>
      {/* Section nav */}
      <div style={{ width: 190, background: C.surface2, borderRight: `1px solid ${C.border}`, padding: "14px 10px", flexShrink: 0 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: C.text, marginBottom: 2 }}>Hooks Deep Dive</div>
        <div style={{ fontSize: 10, color: C.muted, marginBottom: 12 }}>Topic 4 of 8</div>
        {[
          { t: "Concept",   active: true,  done: false },
          { t: "Hands-on",  active: false, done: false },
          { t: "Video",     active: false, done: false },
          { t: "Exercise",  active: false, done: false },
          { t: "Summary",   active: false, done: false },
        ].map(s => (
          <div key={s.t} style={{ display: "flex", alignItems: "center", gap: 7, padding: "5px 8px", borderRadius: 7, marginBottom: 2, background: s.active ? `${C.blue}20` : "transparent" }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: s.active ? C.blue : C.border2 }} />
            <span style={{ fontSize: 11, color: s.active ? C.blue2 : C.muted }}>{s.t}</span>
          </div>
        ))}
      </div>
      {/* Content */}
      <div style={{ flex: 1, padding: "20px 24px", overflow: "hidden" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>React Hooks — useEffect</div>
            {chip("Concept", `${C.blue}20`, C.blue2, `${C.blue}40`)}
          </div>
          <div style={{ background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 7, padding: "4px 10px", fontSize: 10, color: C.dim }}>MDN · React Docs</div>
        </div>
        <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.7, marginBottom: 12 }}>
          The <strong style={{color: C.text}}>useEffect</strong> hook lets you synchronize a component with an external system — DOM, network, subscriptions. It runs after every render unless you control it with a dependency array.
        </div>
        <div style={{ background: C.surface2, border: `1px solid ${C.border2}`, borderRadius: 10, padding: "10px 14px", fontFamily: "monospace", fontSize: 11, marginBottom: 12 }}>
          <div style={{ fontSize: 9, color: C.dim, marginBottom: 6 }}>jsx</div>
          <div><span style={{color:C.blue2}}>useEffect</span><span style={{color:C.text}}>(() =&gt; {"{"}</span></div>
          <div style={{paddingLeft:16}}><span style={{color:C.muted}}>document.title = </span><span style={{color:C.green}}>`Count: {"${count}"}`</span></div>
          <div style={{color:C.text}}>{"}"}, [count]);</div>
        </div>
        <div style={{ background: `${C.amber}15`, border: `1px solid ${C.amber}30`, borderLeft: `4px solid ${C.amber}`, borderRadius: "0 8px 8px 0", padding: "8px 12px" }}>
          <span style={{ fontSize: 11, color: C.text }}>💡 Return a cleanup function to avoid memory leaks from subscriptions and timers.</span>
        </div>
      </div>
    </div>
  )
}

export function CoursesProgress() {
  const courses = [
    { name: "React Fundamentals",  pct: 38, sections: 16, total: 42, color: C.blue   },
    { name: "SQL Mastery",         pct: 72, sections: 29, total: 40, color: C.green  },
    { name: "System Design",       pct: 10, sections: 4,  total: 38, color: C.amber  },
    { name: "AWS Solutions Arch.", pct: 0,  sections: 0,  total: 55, color: C.purple },
  ]
  return (
    <div style={{ ...W, background: C.bg, display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "14px 22px", borderBottom: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>My Courses</div>
        <div style={{ display: "flex", gap: 16 }}>
          {[["4", "courses"], ["87", "sections done"], ["2", "completed"]].map(([n, l]) => (
            <div key={l} style={{ textAlign: "center" }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: C.text }}>{n}</div>
              <div style={{ fontSize: 10, color: C.muted }}>{l}</div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ flex: 1, padding: "14px 22px", display: "flex", flexDirection: "column", gap: 10, overflow: "hidden" }}>
        {courses.map(c => (
          <div key={c.name} style={{ background: C.surface, border: `1px solid ${C.border2}`, borderRadius: 12, padding: "12px 16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{c.name}</div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 11, color: C.muted }}>{c.sections}/{c.total} sections</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: c.pct === 100 ? C.green : c.pct > 0 ? c.color : C.dim }}>{c.pct}%</span>
              </div>
            </div>
            <div style={{ background: C.surface2, borderRadius: 9999, height: 5 }}>
              <div style={{ width: `${c.pct}%`, height: "100%", background: `linear-gradient(90deg, ${c.color}, ${c.color}80)`, borderRadius: 9999, transition: "width 0.3s" }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── INTERVIEW PREP ───────────────────────────────────────────────────────────

export function InterviewModes() {
  const modes = [
    { icon: "⚡", title: "By Skill",           desc: "Choose a skill and difficulty. Get 10 targeted questions.", color: C.blue,   active: false },
    { icon: "📋", title: "By Job Description", desc: "Paste a JD. Get role-specific interview questions.", color: C.green, active: true  },
    { icon: "📚", title: "From Your Notes",    desc: "Quiz yourself on your own notes, courses, and highlights.", color: C.purple, active: false },
  ]
  return (
    <div style={{ ...W, background: C.bg, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px 32px" }}>
      <div style={{ fontSize: 20, fontWeight: 800, color: C.text, marginBottom: 6 }}>How do you want to practise?</div>
      <div style={{ fontSize: 13, color: C.muted, marginBottom: 24 }}>Choose a mode to start your session</div>
      <div style={{ display: "flex", gap: 14, width: "100%" }}>
        {modes.map(m => (
          <div key={m.title} style={{ flex: 1, background: m.active ? `${m.color}15` : C.surface, border: `${m.active ? "2px" : "1px"} solid ${m.active ? m.color : C.border2}`, borderRadius: 16, padding: "18px 16px", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: 8 }}>
            <div style={{ width: 48, height: 48, borderRadius: 14, background: `${m.color}20`, border: `1px solid ${m.color}40`, display: "grid", placeItems: "center", fontSize: 22 }}>{m.icon}</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: m.active ? C.text : C.muted }}>{m.title}</div>
            <div style={{ fontSize: 11, color: C.dim, lineHeight: 1.5 }}>{m.desc}</div>
            {m.active && <div style={{ background: m.color, borderRadius: 8, padding: "6px 16px", fontSize: 11, fontWeight: 600, color: "white", marginTop: 4 }}>Select →</div>}
          </div>
        ))}
      </div>
    </div>
  )
}

export function InterviewVoice() {
  return (
    <div style={{ ...W, background: C.bg, display: "flex" }}>
      {/* Recording panel */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "20px 28px", borderRight: `1px solid ${C.border}` }}>
        <div style={{ fontSize: 11, color: C.muted, marginBottom: 14, textAlign: "center", lineHeight: 1.5 }}>
          <span style={{ fontWeight: 700, color: C.text }}>Q8 / 12 · React</span> · What is the virtual DOM and how does React use it?
        </div>
        {/* Waveform */}
        <div style={{ display: "flex", alignItems: "center", gap: 3, height: 48, marginBottom: 16 }}>
          {[8,14,22,18,30,24,36,28,40,34,28,20,32,38,26,18,32,24,16,10].map((h, i) => (
            <div key={i} style={{ width: 5, height: h, borderRadius: 3, background: i < 12 ? C.amber : `${C.amber}40` }} />
          ))}
        </div>
        <div style={{ fontSize: 24, fontWeight: 800, color: C.amber, marginBottom: 8, fontFamily: "monospace" }}>0:47</div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <div style={{ width: 56, height: 56, borderRadius: "50%", background: `${C.amber}20`, border: `2px solid ${C.amber}`, display: "grid", placeItems: "center", fontSize: 24 }}>🎙</div>
          <div style={{ background: `${C.red}20`, border: `1px solid ${C.red}40`, borderRadius: 10, padding: "8px 16px", fontSize: 12, fontWeight: 600, color: "#F87171" }}>Stop Recording</div>
        </div>
      </div>
      {/* Live feedback */}
      <div style={{ width: 220, background: C.surface2, padding: "16px 14px", flexShrink: 0 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: C.dim, letterSpacing: "0.08em", marginBottom: 12 }}>LIVE FEEDBACK</div>
        {[
          { label: "Pace",           val: "Good",    color: C.green },
          { label: "Answer length",  val: "On track", color: C.blue  },
          { label: "Filler words",   val: "2 (um)",   color: C.amber },
        ].map(f => (
          <div key={f.label} style={{ marginBottom: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
              <span style={{ fontSize: 11, color: C.muted }}>{f.label}</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: f.color }}>{f.val}</span>
            </div>
            <div style={{ background: C.surface, borderRadius: 9999, height: 4 }}>
              <div style={{ width: f.color === C.green ? "80%" : f.color === C.blue ? "60%" : "40%", height: "100%", background: f.color, borderRadius: 9999 }} />
            </div>
          </div>
        ))}
        <div style={{ marginTop: 14, background: `${C.amber}15`, border: `1px solid ${C.amber}30`, borderRadius: 10, padding: "8px 10px" }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: C.amber, marginBottom: 3 }}>TIP</div>
          <div style={{ fontSize: 10, color: C.muted, lineHeight: 1.5 }}>Try to reduce "um" — pause instead. Silence sounds confident.</div>
        </div>
        <div style={{ marginTop: 10, fontSize: 10, color: C.dim, textAlign: "center" }}>Speaking for ~45 sec — ideal is 60–90 sec</div>
      </div>
    </div>
  )
}

export function InterviewResults() {
  const topics = [
    { name: "React Core",   score: 8, total: 10, pct: 80 },
    { name: "Hooks",        score: 7, total: 10, pct: 70 },
    { name: "Performance",  score: 5, total: 10, pct: 50 },
    { name: "TypeScript",   score: 9, total: 10, pct: 90 },
  ]
  return (
    <div style={{ ...W, background: C.bg, display: "flex" }}>
      {/* Score summary */}
      <div style={{ width: 200, background: C.surface2, borderRight: `1px solid ${C.border}`, padding: "16px 14px", flexShrink: 0 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: C.dim, letterSpacing: "0.08em", marginBottom: 14 }}>SESSION RESULTS</div>
        <div style={{ textAlign: "center", marginBottom: 16 }}>
          <div style={{ fontSize: 32, fontWeight: 800, color: C.green }}>29</div>
          <div style={{ fontSize: 12, color: C.muted }}>out of 40</div>
          <div style={{ fontSize: 11, color: C.green, marginTop: 2 }}>72% · Strong</div>
        </div>
        {topics.map(t => (
          <div key={t.name} style={{ marginBottom: 8 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
              <span style={{ fontSize: 11, color: C.muted }}>{t.name}</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: t.pct >= 80 ? C.green : t.pct >= 60 ? C.amber : C.red }}>{t.score}/{t.total}</span>
            </div>
            <div style={{ background: C.surface, borderRadius: 9999, height: 4 }}>
              <div style={{ width: `${t.pct}%`, height: "100%", background: t.pct >= 80 ? C.green : t.pct >= 60 ? C.amber : C.red, borderRadius: 9999 }} />
            </div>
          </div>
        ))}
      </div>
      {/* Question review */}
      <div style={{ flex: 1, padding: "16px 20px", overflow: "hidden" }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: C.text, marginBottom: 12 }}>Question Review</div>
        {[
          { q: "What is the virtual DOM?",             correct: true,  yours: "A lightweight JS rep of the real DOM." },
          { q: "How does useCallback differ from useMemo?", correct: false, yours: "They are basically the same thing.", model: "useCallback memoizes a function; useMemo memoizes a computed value." },
          { q: "What are React Server Components?",    correct: true,  yours: "Components rendered on the server with no JS sent to client." },
        ].map((r, i) => (
          <div key={i} style={{ background: C.surface, border: `1px solid ${r.correct ? `${C.green}30` : `${C.red}30`}`, borderRadius: 10, padding: "10px 12px", marginBottom: 8 }}>
            <div style={{ display: "flex", gap: 8, alignItems: "flex-start", marginBottom: 5 }}>
              <span style={{ fontSize: 13, color: r.correct ? C.green : "#F87171", flexShrink: 0 }}>{r.correct ? "✓" : "✗"}</span>
              <span style={{ fontSize: 12, color: C.text }}>{r.q}</span>
            </div>
            <div style={{ paddingLeft: 20 }}>
              <div style={{ fontSize: 11, color: C.muted }}>Your answer: {r.yours}</div>
              {!r.correct && <div style={{ fontSize: 11, color: C.green, marginTop: 4 }}>✦ Model: {r.model}</div>}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── NOTES ────────────────────────────────────────────────────────────────────

export function NotesBlocks() {
  const blocks = [
    { icon: "¶",  label: "Paragraph",  hint: "Plain text" },
    { icon: "H1", label: "Heading 1",  hint: "Large title" },
    { icon: "H2", label: "Heading 2",  hint: "Section heading" },
    { icon: "⌨", label: "Code block", hint: "With syntax highlighting" },
    { icon: "⊞",  label: "Table",     hint: "Rows and columns" },
    { icon: "⚠",  label: "Callout",   hint: "Note, warning, tip" },
    { icon: "∑",  label: "Math",      hint: "LaTeX equations" },
    { icon: "▶",  label: "Video",     hint: "YouTube embed" },
  ]
  return (
    <div style={{ ...W, background: C.bg, display: "flex" }}>
      {/* Editor with slash menu */}
      <div style={{ flex: 1, padding: "24px 30px", position: "relative", overflow: "hidden" }}>
        <div style={{ fontSize: 22, fontWeight: 800, color: C.text, marginBottom: 4 }}>Docker Cheatsheet</div>
        <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.7, marginBottom: 12 }}>
          Common Docker commands for daily use. Starting with container management...
        </div>
        {/* Cursor line with / trigger */}
        <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 4 }}>
          <span style={{ fontSize: 13, color: C.blue2, fontWeight: 600 }}>/</span>
          <span style={{ fontSize: 13, color: C.dim }}>code</span>
          <div style={{ width: 2, height: 16, background: C.blue, animation: "none" }} />
        </div>
        {/* Slash menu dropdown */}
        <div style={{ position: "absolute", left: 42, top: 140, background: C.surface, border: `1px solid ${C.border2}`, borderRadius: 12, padding: "6px", width: 240, boxShadow: "0 16px 40px rgba(0,0,0,0.50)", zIndex: 10 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: C.dim, letterSpacing: "0.08em", padding: "4px 10px", marginBottom: 2 }}>BASIC BLOCKS</div>
          {blocks.map((b, i) => (
            <div key={b.label} style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 10px", borderRadius: 8, background: i === 3 ? `${C.blue}20` : "transparent", cursor: "pointer" }}>
              <div style={{ width: 28, height: 28, borderRadius: 7, background: C.surface2, border: `1px solid ${C.border}`, display: "grid", placeItems: "center", fontSize: 11, color: i === 3 ? C.blue2 : C.muted, flexShrink: 0, fontFamily: "monospace" }}>{b.icon}</div>
              <div>
                <div style={{ fontSize: 12, color: i === 3 ? C.text : C.muted, fontWeight: i === 3 ? 600 : 400 }}>{b.label}</div>
                <div style={{ fontSize: 10, color: C.dim }}>{b.hint}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export function NotesSearch() {
  return (
    <div style={{ ...W, background: C.bg, position: "relative", overflow: "hidden" }}>
      {/* Blurred notes behind */}
      <div style={{ position: "absolute", inset: 0, padding: "20px 28px", filter: "blur(2px)", opacity: 0.4 }}>
        <div style={{ fontSize: 18, fontWeight: 800, color: C.text, marginBottom: 8 }}>React Learning Plan</div>
        <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.7 }}>Starting with useEffect — the most commonly misunderstood hook. Key insight: the dependency array controls when the effect runs...</div>
      </div>
      {/* Search overlay */}
      <div style={{ position: "absolute", inset: 0, background: "rgba(10,22,40,0.85)", display: "flex", alignItems: "flex-start", justifyContent: "center", paddingTop: "10%" }}>
        <div style={{ background: C.surface, border: `1px solid ${C.border2}`, borderRadius: 16, width: 500, boxShadow: "0 32px 80px rgba(0,0,0,0.60)" }}>
          <div style={{ padding: "14px 16px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 14, color: C.muted }}>🔍</span>
            <span style={{ fontSize: 13, color: C.text }}>useEffect</span>
            <div style={{ width: 2, height: 16, background: C.blue }} />
          </div>
          <div style={{ padding: "8px" }}>
            {[
              { note: "React Learning Plan",  match: "…the dependency array controls when the effect runs, not…", tag: "#react" },
              { note: "Interview Questions",  match: "…useEffect cleanup: return a function that cancels subscriptions…", tag: "#interview" },
              { note: "Docker Cheatsheet",    match: "No matches in this note",                                   tag: null, dim: true },
            ].map(r => (
              <div key={r.note} style={{ padding: "10px 12px", borderRadius: 10, marginBottom: 4, background: r.dim ? "transparent" : `${C.blue}10`, border: `1px solid ${r.dim ? C.border : `${C.blue}20`}`, opacity: r.dim ? 0.4 : 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: C.text }}>📄 {r.note}</span>
                  {r.tag && chip(r.tag, `${C.blue}15`, C.blue2, `${C.blue}30`)}
                </div>
                <div style={{ fontSize: 11, color: C.muted, lineHeight: 1.5 }}>
                  {!r.dim ? (
                    <>{r.match.split("useEffect").map((part, i, arr) => <span key={i}>{part}{i < arr.length-1 && <mark style={{background:`${C.amber}40`,color:C.text,borderRadius:3,padding:"0 2px"}}>useEffect</mark>}</span>)}</>
                  ) : r.match}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export function NotesWikilinks() {
  return (
    <div style={{ ...W, background: C.bg, display: "flex" }}>
      {/* Editor */}
      <div style={{ flex: 1, padding: "22px 28px", overflow: "hidden" }}>
        <div style={{ fontSize: 20, fontWeight: 800, color: C.text, marginBottom: 6 }}>React Learning Plan</div>
        <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
          {chip("#react", `${C.blue}20`, C.blue2, `${C.blue}40`)}
          {chip("#learning", `${C.green}20`, C.green, `${C.green}40`)}
        </div>
        <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.8, marginBottom: 12 }}>
          Starting with <strong style={{color:C.text}}>useEffect</strong> — see{" "}
          <span style={{ color: C.blue2, background: `${C.blue}15`, borderRadius: 4, padding: "1px 6px", fontSize: 12, textDecoration: "underline dotted", cursor: "pointer" }}>[[useCallback vs useMemo]]</span>
          {" "}for comparison. Performance patterns are covered in{" "}
          <span style={{ color: C.blue2, background: `${C.blue}15`, borderRadius: 4, padding: "1px 6px", fontSize: 12, textDecoration: "underline dotted", cursor: "pointer" }}>[[React Performance]]</span>.
        </div>
        <div style={{ fontSize: 11, fontWeight: 700, color: C.dim, letterSpacing: "0.06em", marginBottom: 8 }}>BACKLINKS (2)</div>
        {["Interview Questions", "System Design Notes"].map(n => (
          <div key={n} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 10px", borderRadius: 8, marginBottom: 4, background: C.surface, border: `1px solid ${C.border2}` }}>
            <span style={{ fontSize: 11, color: C.dim }}>←</span>
            <span style={{ fontSize: 12, color: C.blue2 }}>{n}</span>
          </div>
        ))}
      </div>
      {/* Knowledge graph */}
      <div style={{ width: 200, background: C.surface2, borderLeft: `1px solid ${C.border}`, padding: "14px 12px", flexShrink: 0 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: C.dim, letterSpacing: "0.08em", marginBottom: 10 }}>KNOWLEDGE GRAPH</div>
        <svg viewBox="0 0 170 170" width="170" height="170">
          {/* edges */}
          <line x1="85" y1="85" x2="32" y2="40"  stroke="rgba(255,255,255,0.12)" strokeWidth="1.5" />
          <line x1="85" y1="85" x2="148" y2="40" stroke="rgba(255,255,255,0.12)" strokeWidth="1.5" />
          <line x1="85" y1="85" x2="32" y2="140" stroke="rgba(255,255,255,0.12)" strokeWidth="1.5" />
          <line x1="85" y1="85" x2="148" y2="130"stroke="rgba(255,255,255,0.12)" strokeWidth="1.5" />
          {/* center node */}
          <circle cx="85" cy="85" r="28" fill={`${C.blue}30`} stroke={C.blue} strokeWidth="2" />
          <text x="85" y="82" textAnchor="middle" fill="white" fontSize="8" fontWeight="700">React</text>
          <text x="85" y="93" textAnchor="middle" fill={C.muted} fontSize="7">Learning Plan</text>
          {/* other nodes */}
          {[
            [32,  40, "useCallback\nvs useMemo", C.blue2],
            [148, 40, "React\nPerformance",      C.green],
            [32, 140, "Interview\nQuestions",    C.amber],
            [148,130, "System\nDesign",          C.purple],
          ].map(([cx,cy,label,color]) => (
            <g key={label}>
              <circle cx={cx} cy={cy} r={20} fill={C.surface} stroke={color} strokeWidth="1.5" />
              {label.split("\n").map((l,li) => <text key={li} x={cx} y={cy + li*10 - 4} textAnchor="middle" fill={color} fontSize="7">{l}</text>)}
            </g>
          ))}
        </svg>
      </div>
    </div>
  )
}

// ─── JOBS ─────────────────────────────────────────────────────────────────────

export function JobsProfile() {
  return (
    <div style={{ ...W, background: C.bg, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px 40px" }}>
      <div style={{ width: "100%", maxWidth: 520 }}>
        <div style={{ fontSize: 18, fontWeight: 800, color: C.text, marginBottom: 4 }}>Your Job Preferences</div>
        <div style={{ fontSize: 12, color: C.muted, marginBottom: 22 }}>Set once. Jobs come to you.</div>
        <div style={{ display: "flex", gap: 14, marginBottom: 16 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, color: C.muted, marginBottom: 5 }}>Job title</div>
            <div style={{ background: C.surface, border: `1px solid ${C.blue}60`, borderRadius: 10, padding: "10px 12px", fontSize: 13, color: C.text }}>React Developer</div>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, color: C.muted, marginBottom: 5 }}>Location</div>
            <div style={{ background: C.surface, border: `1px solid ${C.border2}`, borderRadius: 10, padding: "10px 12px", fontSize: 13, color: C.text }}>Chennai, India</div>
          </div>
        </div>
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, color: C.muted, marginBottom: 8 }}>Work type</div>
          <div style={{ display: "flex", gap: 8 }}>
            {[["Remote", true], ["On-site", false], ["Hybrid", true]].map(([l, on]) => (
              <div key={l} style={{ padding: "6px 14px", borderRadius: 9999, fontSize: 12, background: on ? `${C.blue}20` : C.surface, border: `1.5px solid ${on ? C.blue : C.border}`, color: on ? C.blue2 : C.muted, cursor: "pointer" }}>{l}</div>
            ))}
          </div>
        </div>
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 11, color: C.muted, marginBottom: 8 }}>Active preferences</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {["React Developer · Chennai", "Remote · Full-time", "Last updated 2h ago"].map(t => chip(t, C.surface, C.muted, C.border))}
          </div>
        </div>
        <div style={{ background: C.blue, borderRadius: 10, padding: "11px", textAlign: "center", fontSize: 13, fontWeight: 600, color: "white" }}>
          Find matching jobs →
        </div>
      </div>
    </div>
  )
}

export function JobsListings() {
  const jobs = [
    { title: "Senior React Developer", co: "Razorpay",  loc: "Chennai",   type: "Full-time", match: 94, days: "2 days ago"  },
    { title: "Frontend Engineer",      co: "Freshworks", loc: "Chennai",   type: "Hybrid",    match: 88, days: "1 day ago"   },
    { title: "Full Stack Developer",   co: "Zoho",       loc: "Remote",    type: "Full-time", match: 81, days: "3 days ago"  },
    { title: "React Engineer",         co: "CRED",       loc: "Bangalore", type: "On-site",   match: 76, days: "Today"       },
  ]
  return (
    <div style={{ ...W, background: C.bg, display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "12px 20px", borderBottom: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>Jobs for you</div>
          <div style={{ fontSize: 10, color: C.muted }}>React Developer · Chennai · Updated 2h ago</div>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          {["All", "Remote", "Full-time"].map((f, i) => (
            <div key={f} style={{ padding: "3px 10px", borderRadius: 9999, fontSize: 11, background: i === 0 ? C.blue : "transparent", border: `1px solid ${i === 0 ? C.blue : C.border2}`, color: i === 0 ? "white" : C.muted }}>{f}</div>
          ))}
        </div>
      </div>
      <div style={{ flex: 1, padding: "12px 20px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, overflow: "hidden" }}>
        {jobs.map(j => (
          <div key={j.title} style={{ background: C.surface, border: `1px solid ${C.border2}`, borderRadius: 12, padding: "12px 14px", display: "flex", flexDirection: "column", gap: 7 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: C.text }}>{j.title}</div>
                <div style={{ fontSize: 10, color: C.muted }}>{j.co}</div>
              </div>
              <div style={{ background: `${C.green}20`, border: `1px solid ${C.green}40`, borderRadius: 7, padding: "2px 7px", fontSize: 11, fontWeight: 700, color: C.green }}>{j.match}%</div>
            </div>
            <div style={{ display: "flex", gap: 5 }}>
              {chip("📍 " + j.loc, C.surface2, C.muted, C.border)}
              {chip(j.type, `${C.blue}15`, C.blue2, `${C.blue}30`)}
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "auto" }}>
              <span style={{ fontSize: 10, color: C.dim }}>{j.days}</span>
              <div style={{ display: "flex", gap: 5 }}>
                <div style={{ background: C.blue, borderRadius: 6, padding: "3px 10px", fontSize: 11, fontWeight: 600, color: "white" }}>Apply →</div>
                <div style={{ background: C.surface2, border: `1px solid ${C.border2}`, borderRadius: 6, padding: "3px 8px", fontSize: 11, color: C.muted }}>🔖</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function JobsSaved() {
  const saved = [
    { title: "Senior React Developer",  co: "Razorpay",   status: "Applied",   color: C.blue   },
    { title: "Full Stack Engineer",     co: "Swiggy",     status: "Interview", color: C.green  },
    { title: "Frontend Architect",      co: "Flipkart",   status: "Saved",     color: C.muted  },
    { title: "React Tech Lead",         co: "PhonePe",    status: "Saved",     color: C.muted  },
  ]
  return (
    <div style={{ ...W, background: C.bg, display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "12px 20px", borderBottom: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>Saved Jobs</div>
        <div style={{ display: "flex", gap: 6 }}>
          {["All", "Applied", "Interview", "Saved"].map((s, i) => (
            <div key={s} style={{ padding: "3px 10px", borderRadius: 9999, fontSize: 11, background: i === 0 ? C.blue : "transparent", border: `1px solid ${i === 0 ? C.blue : C.border2}`, color: i === 0 ? "white" : C.muted }}>{s}</div>
          ))}
        </div>
      </div>
      <div style={{ flex: 1, padding: "12px 20px", display: "flex", flexDirection: "column", gap: 8, overflow: "hidden" }}>
        {saved.map(j => (
          <div key={j.title} style={{ background: C.surface, border: `1px solid ${C.border2}`, borderRadius: 12, padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: `${j.color}20`, border: `1px solid ${j.color}40`, display: "grid", placeItems: "center", fontSize: 16 }}>💼</div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{j.title}</div>
                <div style={{ fontSize: 11, color: C.muted }}>{j.co}</div>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ background: `${j.color}20`, border: `1px solid ${j.color}40`, borderRadius: 9999, padding: "3px 10px", fontSize: 11, fontWeight: 600, color: j.color }}>{j.status}</div>
              <div style={{ background: C.blue, borderRadius: 8, padding: "5px 12px", fontSize: 11, fontWeight: 600, color: "white" }}>Apply →</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── ATS SCORE ────────────────────────────────────────────────────────────────

export function ATSPaste() {
  return (
    <div style={{ ...W, background: C.bg, display: "flex" }}>
      {/* Left — JD paste */}
      <div style={{ flex: 1, padding: "20px 22px", borderRight: `1px solid ${C.border}`, display: "flex", flexDirection: "column" }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 4 }}>Paste Job Description</div>
        <div style={{ fontSize: 11, color: C.muted, marginBottom: 12 }}>Any job posting works — LinkedIn, Naukri, Glassdoor</div>
        <div style={{ flex: 1, background: C.surface2, border: `1px solid ${C.border2}`, borderRadius: 12, padding: "12px 14px", fontSize: 11, color: C.muted, lineHeight: 1.7, marginBottom: 12, overflow: "hidden" }}>
          <div style={{ fontWeight: 700, color: C.text, marginBottom: 6 }}>Senior Full Stack Developer — Swiggy</div>
          <div>We are looking for a motivated engineer with strong React experience to join our Checkout team. You will build performant front-end features, collaborate with backend engineers on GraphQL APIs, and ensure our AWS-hosted services scale to millions of users...</div>
          <div style={{ marginTop: 8 }}>Requirements: React, TypeScript, GraphQL, Node.js, AWS, CI/CD, Docker, Agile</div>
        </div>
        <div style={{ background: C.green, borderRadius: 10, padding: "10px", textAlign: "center", fontSize: 13, fontWeight: 600, color: "white" }}>
          ✦ Analyse against my resume →
        </div>
      </div>
      {/* Right — resume selector */}
      <div style={{ width: 200, background: C.surface2, padding: "16px 14px", flexShrink: 0 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: C.dim, letterSpacing: "0.08em", marginBottom: 12 }}>SELECT RESUME</div>
        {["Alex Johnson — 2026", "Alex Johnson — Startup", "Alex Johnson — Senior IC"].map((r, i) => (
          <div key={r} style={{ padding: "8px 10px", borderRadius: 9, marginBottom: 6, background: i === 0 ? `${C.green}20` : "transparent", border: `1.5px solid ${i === 0 ? C.green : C.border}`, fontSize: 12, color: i === 0 ? C.green : C.muted, cursor: "pointer" }}>
            📄 {r}
            {i === 0 && <div style={{ fontSize: 10, color: C.green, marginTop: 2 }}>✓ Selected</div>}
          </div>
        ))}
        <div style={{ marginTop: 14, background: `${C.green}10`, border: `1px solid ${C.green}20`, borderRadius: 9, padding: "8px 10px" }}>
          <div style={{ fontSize: 10, color: C.green, fontWeight: 700, marginBottom: 2 }}>READY TO ANALYSE</div>
          <div style={{ fontSize: 10, color: C.muted }}>Resume selected · JD detected</div>
        </div>
      </div>
    </div>
  )
}

export function ATSScore() {
  const matched = ["React", "TypeScript", "Node.js", "Agile", "Git"]
  const missing = ["GraphQL", "AWS", "CI/CD", "Docker"]
  return (
    <div style={{ ...W, background: C.bg, display: "flex" }}>
      {/* Score panel */}
      <div style={{ flex: 1, padding: "20px 24px", display: "flex", flexDirection: "column", gap: 12, borderRight: `1px solid ${C.border}` }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>ATS Match Score</div>
            <div style={{ fontSize: 11, color: C.muted }}>Senior Full Stack Developer · Swiggy</div>
          </div>
          <div style={{ position: "relative", width: 84, height: 84 }}>
            <svg viewBox="0 0 84 84" style={{ width: 84, height: 84, transform: "rotate(-90deg)" }}>
              <circle cx="42" cy="42" r="34" fill="none" stroke={`${C.amber}25`} strokeWidth="8" />
              <circle cx="42" cy="42" r="34" fill="none" stroke={C.amber} strokeWidth="8"
                strokeDasharray={`${2*Math.PI*34*0.62} ${2*Math.PI*34}`} strokeLinecap="round" />
            </svg>
            <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: C.amber }}>62%</div>
              <div style={{ fontSize: 9, color: C.muted }}>match</div>
            </div>
          </div>
        </div>
        <div style={{ background: `${C.amber}15`, border: `1px solid ${C.amber}30`, borderRadius: 10, padding: "8px 12px" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#F5A623" }}>⚡ Partial Match — improve before applying</div>
          <div style={{ fontSize: 10, color: C.muted, marginTop: 2 }}>You match 5 of 9 required keywords</div>
        </div>
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, color: C.dim, letterSpacing: "0.06em", marginBottom: 5 }}>✓ MATCHED ({matched.length})</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>{matched.map(k => chip(k, `${C.green}20`, C.green, `${C.green}40`))}</div>
        </div>
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, color: C.dim, letterSpacing: "0.06em", marginBottom: 5 }}>✗ MISSING ({missing.length})</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>{missing.map(k => chip(k, `${C.red}15`, "#F87171", `${C.red}30`))}</div>
        </div>
      </div>
      {/* Keyword importance */}
      <div style={{ width: 210, background: C.surface2, padding: "16px 14px", flexShrink: 0 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: C.dim, letterSpacing: "0.08em", marginBottom: 10 }}>KEYWORD WEIGHT</div>
        {[["GraphQL", 92, C.red], ["AWS", 88, C.red], ["React", 95, C.green], ["CI/CD", 70, C.red], ["TypeScript", 82, C.green]].map(([k, w, c]) => (
          <div key={k} style={{ marginBottom: 8 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
              <span style={{ fontSize: 11, color: C.muted }}>{k}</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: c }}>{w}%</span>
            </div>
            <div style={{ background: C.surface, borderRadius: 9999, height: 4 }}>
              <div style={{ width: `${w}%`, height: "100%", background: c, borderRadius: 9999 }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function ATSImprove() {
  const suggestions = [
    { section: "Skills",     action: "Add GraphQL",    detail: "Add 'GraphQL' to your skills section — it appears 3x in the JD.", color: C.red    },
    { section: "Experience", action: "Mention AWS",    detail: "Add an AWS mention in your Razorpay role: 'deployed on AWS EC2'.", color: C.amber  },
    { section: "Summary",    action: "Add CI/CD",      detail: "Include CI/CD in your summary: 'experience with CI/CD pipelines'.", color: C.amber },
    { section: "Skills",     action: "Add Docker",     detail: "Add 'Docker' to your skills — present in 2 requirement bullets.", color: C.dim    },
  ]
  return (
    <div style={{ ...W, background: C.bg, display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "12px 22px", borderBottom: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>Improvement Suggestions</div>
          <div style={{ fontSize: 11, color: C.muted }}>4 changes to reach 90%+ match</div>
        </div>
        <div style={{ position: "relative", width: 60, height: 60 }}>
          <svg viewBox="0 0 60 60" style={{ width: 60, height: 60, transform: "rotate(-90deg)" }}>
            <circle cx="30" cy="30" r="24" fill="none" stroke={`${C.green}25`} strokeWidth="6" />
            <circle cx="30" cy="30" r="24" fill="none" stroke={C.green} strokeWidth="6"
              strokeDasharray={`${2*Math.PI*24*0.91} ${2*Math.PI*24}`} strokeLinecap="round" />
          </svg>
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: C.green }}>91%</div>
            <div style={{ fontSize: 8, color: C.muted }}>after</div>
          </div>
        </div>
      </div>
      <div style={{ flex: 1, padding: "12px 22px", display: "flex", flexDirection: "column", gap: 8, overflow: "hidden" }}>
        {suggestions.map((s, i) => (
          <div key={i} style={{ background: C.surface, border: `1px solid ${C.border2}`, borderRadius: 12, padding: "10px 14px", display: "flex", gap: 12, alignItems: "flex-start" }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: s.color, marginTop: 6, flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 3 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: C.dim, background: C.surface2, borderRadius: 5, padding: "1px 7px" }}>{s.section}</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: C.text }}>{s.action}</div>
              </div>
              <div style={{ fontSize: 11, color: C.muted, lineHeight: 1.5 }}>{s.detail}</div>
            </div>
            <div style={{ background: C.blue, borderRadius: 7, padding: "4px 10px", fontSize: 11, fontWeight: 600, color: "white", flexShrink: 0 }}>Fix →</div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Component map ────────────────────────────────────────────────────────────
// Arrays are ordered to match the DEEP_DIVE sections array in each feature page.
export const DEEP_DIVE_COMPONENT_MAP = {
  "resume-builder": [ResumeEditor, ResumeATS, ResumeExport],
  "career-map":     [CareerMapUpload, CareerMapGraph, CareerMapStudyPlan],
  "courses":        [CoursesStructure, CoursesContent, CoursesProgress],
  "interview-prep": [InterviewModes, InterviewVoice, InterviewResults],
  "notes":          [NotesBlocks, NotesSearch, NotesWikilinks],
  "jobs":           [JobsProfile, JobsListings, JobsSaved],
  "ats-score":      [ATSPaste, ATSScore, ATSImprove],
}
