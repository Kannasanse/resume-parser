'use client';

import { useState } from "react"

// ─── Shared tokens ────────────────────────────────────────────────────────────
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

const chip = (label, bg, color, border) => (
  <span style={{
    background: bg, color, border: `1px solid ${border}`,
    borderRadius: 9999, padding: "2px 10px",
    fontSize: 11, fontWeight: 600, whiteSpace: "nowrap",
  }}>{label}</span>
)

// ─── 1. RESUME BUILDER ────────────────────────────────────────────────────────
export function ResumeBuilderScreenshot() {
  return (
    <div style={{
      background: C.bg, borderRadius: 14, overflow: "hidden",
      border: `1px solid ${C.border2}`, fontFamily: "system-ui, sans-serif",
      aspectRatio: "16/9", display: "flex",
    }}>
      {/* Left sidebar — templates */}
      <div style={{
        width: 180, background: C.surface2, borderRight: `1px solid ${C.border}`,
        padding: "14px 10px", flexShrink: 0,
      }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: C.dim, letterSpacing: "0.08em", marginBottom: 10 }}>TEMPLATES</div>
        {["Azure Wave", "Classic Pro", "Minimal", "Noir Flash", "Verdant"].map((t, i) => (
          <div key={t} style={{
            padding: "8px 10px", borderRadius: 8, marginBottom: 4,
            background: i === 0 ? `${C.blue}25` : "transparent",
            border: i === 0 ? `1px solid ${C.blue}50` : "1px solid transparent",
            fontSize: 12, color: i === 0 ? C.blue2 : C.muted,
            cursor: "pointer",
          }}>{t}</div>
        ))}
        <div style={{ marginTop: 14, fontSize: 10, fontWeight: 700, color: C.dim, letterSpacing: "0.08em", marginBottom: 8 }}>SECTIONS</div>
        {["Contact", "Summary", "Experience", "Education", "Skills"].map((s) => (
          <div key={s} style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "6px 8px", borderRadius: 6, marginBottom: 2, fontSize: 11, color: C.muted,
          }}>
            <div style={{ width: 5, height: 5, borderRadius: "50%", background: C.green }} />
            {s}
          </div>
        ))}
      </div>

      {/* Centre — resume canvas */}
      <div style={{
        flex: 1, display: "flex", flexDirection: "column",
        background: "#F4F8FC", padding: "24px 20px", overflow: "hidden",
      }}>
        <div style={{
          background: "white", borderRadius: 8, flex: 1, padding: "20px 24px",
          boxShadow: "0 4px 20px rgba(0,0,0,0.10)",
          overflow: "hidden",
        }}>
          {/* Header band */}
          <div style={{
            background: "linear-gradient(135deg, #185FA5, #5B9FD4)",
            margin: "-20px -24px 16px", padding: "18px 24px",
          }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: "white", letterSpacing: "-0.02em" }}>Alex Johnson</div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.80)", marginTop: 2 }}>Senior React Developer · Chennai, India</div>
            <div style={{ display: "flex", gap: 12, marginTop: 6 }}>
              {["alex@email.com", "linkedin.com/in/alex", "+91 98765 43210"].map(t => (
                <span key={t} style={{ fontSize: 10, color: "rgba(255,255,255,0.70)" }}>{t}</span>
              ))}
            </div>
          </div>
          {/* Summary */}
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#185FA5", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4, borderBottom: "2px solid #185FA5", paddingBottom: 2 }}>Summary</div>
            <div style={{ fontSize: 11, color: "#4B5563", lineHeight: 1.5 }}>
              Full-stack developer with 6+ years building scalable React applications. Led teams of 8 engineers across fintech and e-commerce domains.
            </div>
          </div>
          {/* Experience */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#185FA5", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8, borderBottom: "2px solid #185FA5", paddingBottom: 2 }}>Experience</div>
            {[
              { role: "Senior React Developer", co: "Razorpay", period: "2022 – Present" },
              { role: "Frontend Engineer", co: "Freshworks", period: "2019 – 2022" },
            ].map(e => (
              <div key={e.co} style={{ marginBottom: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "#1F2937" }}>{e.role}</span>
                  <span style={{ fontSize: 10, color: "#9CA3AF" }}>{e.period}</span>
                </div>
                <div style={{ fontSize: 11, color: "#185FA5", marginBottom: 3 }}>{e.co}</div>
                <div style={{ fontSize: 10, color: "#6B7280" }}>• Built and maintained component library used by 40+ engineers</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right — live editing panel */}
      <div style={{
        width: 200, background: C.surface, borderLeft: `1px solid ${C.border}`,
        padding: "14px 12px", flexShrink: 0,
      }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: C.dim, letterSpacing: "0.08em", marginBottom: 12 }}>EDITING: EXPERIENCE</div>
        {[["Job Title", "Senior React Developer"], ["Company", "Razorpay"], ["Duration", "2022 – Present"]].map(([label, val]) => (
          <div key={label} style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 10, color: C.muted, marginBottom: 3 }}>{label}</div>
            <div style={{
              background: C.surface2, border: `1px solid ${C.border2}`,
              borderRadius: 7, padding: "6px 8px", fontSize: 11, color: C.text,
            }}>{val}</div>
          </div>
        ))}
        <div style={{ marginTop: 14 }}>
          <div style={{ fontSize: 10, color: C.muted, marginBottom: 6 }}>ATS SCORE</div>
          <div style={{
            background: `${C.green}20`, border: `1px solid ${C.green}40`,
            borderRadius: 10, padding: "10px 12px", textAlign: "center",
          }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: C.green }}>87%</div>
            <div style={{ fontSize: 10, color: C.muted }}>Strong match</div>
          </div>
        </div>
        <div style={{ marginTop: 10, display: "flex", gap: 6 }}>
          <div style={{
            flex: 1, background: C.blue, borderRadius: 8, padding: "7px 0",
            textAlign: "center", fontSize: 11, fontWeight: 600, color: "white",
          }}>PDF</div>
          <div style={{
            flex: 1, background: C.surface2, border: `1px solid ${C.border2}`,
            borderRadius: 8, padding: "7px 0", textAlign: "center",
            fontSize: 11, fontWeight: 600, color: C.muted,
          }}>Word</div>
        </div>
      </div>
    </div>
  )
}

// ─── 2. CAREER MAP ────────────────────────────────────────────────────────────
export function CareerMapScreenshot() {
  const nodes = [
    { x: 120, y: 180, label: "Senior React\nDeveloper", current: true },
    { x: 320, y: 80,  label: "Engineering\nManager",    type: "vertical" },
    { x: 320, y: 180, label: "Full Stack\nArchitect",   type: "vertical" },
    { x: 320, y: 280, label: "Product\nEngineer",       type: "horizontal" },
    { x: 520, y: 80,  label: "VP\nEngineering",          type: "vertical" },
    { x: 520, y: 280, label: "Technical\nProduct Mgr",  type: "diagonal" },
  ]
  const edges = [
    [120,180, 320,80], [120,180, 320,180], [120,180, 320,280],
    [320,80,  520,80], [320,280, 520,280],
  ]
  const typeColor = { vertical: C.blue, horizontal: C.green, diagonal: C.amber }

  return (
    <div style={{
      background: C.bg, borderRadius: 14, overflow: "hidden",
      border: `1px solid ${C.border2}`, fontFamily: "system-ui, sans-serif",
      aspectRatio: "16/9", display: "flex",
    }}>
      {/* Left panel */}
      <div style={{
        width: 200, background: C.surface2, borderRight: `1px solid ${C.border}`,
        padding: "16px 14px", flexShrink: 0,
      }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: C.text, marginBottom: 4 }}>Career Map</div>
        <div style={{ fontSize: 10, color: C.muted, marginBottom: 16 }}>Based on your resume · 6 paths found</div>
        <div style={{ fontSize: 10, fontWeight: 700, color: C.dim, letterSpacing: "0.08em", marginBottom: 8 }}>PATH TYPES</div>
        {[
          { label: "Vertical growth",   count: 2, color: C.blue  },
          { label: "Horizontal pivot",  count: 2, color: C.green },
          { label: "Diagonal leap",     count: 2, color: C.amber },
        ].map(p => (
          <div key={p.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ width: 8, height: 8, borderRadius: 2, background: p.color }} />
              <span style={{ fontSize: 11, color: C.muted }}>{p.label}</span>
            </div>
            <span style={{ fontSize: 11, fontWeight: 700, color: C.text }}>{p.count}</span>
          </div>
        ))}
        <div style={{ marginTop: 20, padding: "10px 10px", background: `${C.blue}15`, border: `1px solid ${C.blue}30`, borderRadius: 10 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: C.blue2, marginBottom: 4 }}>SELECTED PATH</div>
          <div style={{ fontSize: 12, fontWeight: 700, color: C.text }}>Engineering Manager</div>
          <div style={{ fontSize: 10, color: C.muted, marginTop: 2 }}>~18 months · 3 skills gap</div>
          <div style={{
            marginTop: 8, background: C.blue, borderRadius: 7, padding: "6px 0",
            textAlign: "center", fontSize: 11, fontWeight: 600, color: "white",
          }}>View study plan</div>
        </div>
      </div>

      {/* Graph area */}
      <div style={{ flex: 1, position: "relative", padding: 20 }}>
        <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} viewBox="0 0 640 400">
          {edges.map(([x1,y1,x2,y2], i) => (
            <line key={i} x1={x1} y1={y1} x2={x2} y2={y2}
              stroke="rgba(255,255,255,0.12)" strokeWidth={1.5} strokeDasharray="4 4" />
          ))}
          {nodes.map(n => (
            <g key={n.label} transform={`translate(${n.x},${n.y})`}>
              <circle r={38} fill={n.current ? C.blue : C.surface}
                stroke={n.current ? C.blue2 : (typeColor[n.type] || C.border2)}
                strokeWidth={n.current ? 3 : 1.5}
              />
              {n.current && <circle r={44} fill="none" stroke={`${C.blue}40`} strokeWidth={8} />}
              {n.label.split("\n").map((line, li) => (
                <text key={li} x={0} y={li * 13 - 6} textAnchor="middle"
                  fill={n.current ? "white" : C.text}
                  fontSize={9} fontWeight={n.current ? 700 : 500}
                >{line}</text>
              ))}
            </g>
          ))}
        </svg>
        {/* Legend */}
        <div style={{ position: "absolute", bottom: 16, right: 16, display: "flex", gap: 12 }}>
          {[["#185FA5","Vertical"], ["#1D9E75","Horizontal"], ["#F59E0B","Diagonal"]].map(([c,l]) => (
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

// ─── 3. INTERVIEW PREP ────────────────────────────────────────────────────────
export function InterviewPrepScreenshot() {
  return (
    <div style={{
      background: "#F4F8FC", borderRadius: 14, overflow: "hidden",
      border: `1px solid #D1DCE8`, fontFamily: "system-ui, sans-serif",
      aspectRatio: "16/9", display: "flex", flexDirection: "column",
    }}>
      {/* Progress bar */}
      <div style={{ height: 6, background: "#E6F1FB" }}>
        <div style={{ width: "47%", height: "100%", background: "linear-gradient(90deg, #185FA5, #1D9E75)" }} />
      </div>
      {/* Top bar */}
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "8px 20px", borderBottom: "1px solid #D1DCE8", background: "white",
      }}>
        <span style={{ fontSize: 12, color: "#6B7280" }}>Question 7 of 15</span>
        <span style={{ fontSize: 12, color: "#6B7280" }}>17:26 remaining · 42% of time used</span>
      </div>
      {/* Main card */}
      <div style={{ flex: 1, padding: "16px 24px", display: "flex", flexDirection: "column" }}>
        <div style={{
          background: "white", borderRadius: 14, flex: 1, padding: "20px",
          border: "1px solid #D1DCE8", boxShadow: "0 2px 12px rgba(12,68,124,0.06)",
          display: "flex", flexDirection: "column",
        }}>
          {/* Meta row */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 12, color: "#9CA3AF", fontWeight: 600 }}>Q 7</span>
              {chip("React", "#E6F1FB", "#185FA5", "rgba(24,95,165,0.20)")}
              {chip("Medium", "#FEF3C7", "#B45309", "rgba(245,158,11,0.20)")}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{
                background: "#FEF3C7", border: "1px solid rgba(245,158,11,0.30)",
                borderRadius: 9999, padding: "3px 10px",
                fontSize: 12, fontWeight: 700, color: "#B45309", fontFamily: "monospace",
              }}>⏱ 12:34</div>
              <div style={{
                border: "1px solid #D1DCE8", borderRadius: 9999, padding: "3px 10px",
                fontSize: 11, color: "#6B7280",
              }}>⚑ Flag for review</div>
            </div>
          </div>
          {/* Question */}
          <div style={{ fontSize: 15, fontWeight: 700, color: "#2C2C2A", marginBottom: 14, lineHeight: 1.4 }}>
            What is the difference between useMemo and useCallback in React?
          </div>
          {/* Options */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8, flex: 1 }}>
            {[
              { l: "A", t: "useMemo memoizes a value; useCallback memoizes a function.", sel: false },
              { l: "B", t: "useMemo runs after render; useCallback runs before render.", sel: true  },
              { l: "C", t: "useMemo is for objects; useCallback is for primitives.",     sel: false },
              { l: "D", t: "There is no difference — they are aliases.",                  sel: false },
            ].map(o => (
              <div key={o.l} style={{
                display: "flex", alignItems: "center", gap: 12,
                border: `${o.sel ? "2px" : "1.5px"} solid ${o.sel ? "#185FA5" : "#D1DCE8"}`,
                borderRadius: 10, padding: "10px 14px",
                background: o.sel ? "linear-gradient(135deg, #E6F1FB, #F4F8FC)" : "white",
              }}>
                <div style={{
                  width: 26, height: 26, borderRadius: 7, flexShrink: 0,
                  background: o.sel ? "#185FA5" : "#F4F8FC",
                  border: `1px solid ${o.sel ? "#185FA5" : "#D1DCE8"}`,
                  display: "grid", placeItems: "center",
                  fontSize: 11, fontWeight: 700, color: o.sel ? "white" : "#6B7280",
                }}>{o.l}</div>
                <span style={{ fontSize: 12, color: "#2C2C2A", flex: 1 }}>{o.t}</span>
                {o.sel && <span style={{ fontSize: 14, color: "#185FA5" }}>✓</span>}
              </div>
            ))}
          </div>
          {/* Nav */}
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 14, paddingTop: 12, borderTop: "1px solid #D1DCE8" }}>
            <div style={{ border: "1px solid #D1DCE8", borderRadius: 9, padding: "7px 16px", fontSize: 12, color: "#6B7280" }}>← Previous</div>
            <div style={{ background: "#185FA5", borderRadius: 9, padding: "7px 20px", fontSize: 12, fontWeight: 600, color: "white" }}>Next →</div>
          </div>
        </div>
      </div>
      {/* Question dots */}
      <div style={{ display: "flex", justifyContent: "center", gap: 5, padding: "10px 0", background: "white", borderTop: "1px solid #D1DCE8" }}>
        {Array.from({length: 15}).map((_, i) => (
          <div key={i} style={{
            width: 28, height: 28, borderRadius: "50%",
            display: "grid", placeItems: "center",
            fontSize: 11, fontWeight: 600,
            background: i === 6 ? "#185FA5" : i < 6 ? "#1D9E75" : "white",
            border: `1.5px solid ${i === 6 ? "#185FA5" : i < 6 ? "#1D9E75" : "#D1DCE8"}`,
            color: i <= 6 ? "white" : "#9CA3AF",
            boxShadow: i === 6 ? "0 0 0 3px rgba(24,95,165,0.20)" : "none",
          }}>{i+1}</div>
        ))}
      </div>
    </div>
  )
}

// ─── 4. NOTES ─────────────────────────────────────────────────────────────────
export function NotesScreenshot() {
  return (
    <div style={{
      background: C.bg, borderRadius: 14, overflow: "hidden",
      border: `1px solid ${C.border2}`, fontFamily: "system-ui, sans-serif",
      aspectRatio: "16/9", display: "flex",
    }}>
      {/* Sidebar */}
      <div style={{
        width: 220, background: C.surface2, borderRight: `1px solid ${C.border}`,
        padding: "14px 12px", flexShrink: 0,
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: C.text }}>Notes</span>
          <div style={{ background: C.blue, borderRadius: 6, padding: "3px 8px", fontSize: 11, fontWeight: 600, color: "white" }}>+ New</div>
        </div>
        <div style={{
          display: "flex", alignItems: "center", gap: 6,
          background: C.surface, border: `1px solid ${C.border}`,
          borderRadius: 8, padding: "6px 10px", marginBottom: 14,
        }}>
          <span style={{ fontSize: 11, color: C.dim }}>🔍</span>
          <span style={{ fontSize: 11, color: C.dim }}>Search notes...</span>
        </div>
        <div style={{ fontSize: 10, fontWeight: 700, color: C.dim, letterSpacing: "0.08em", marginBottom: 6 }}>PINNED</div>
        {["React Learning Plan", "System Design Notes"].map((n, i) => (
          <div key={n} style={{
            padding: "7px 8px", borderRadius: 8, marginBottom: 3,
            background: i === 0 ? `${C.blue}20` : "transparent",
            border: i === 0 ? `1px solid ${C.blue}40` : "1px solid transparent",
            fontSize: 12, color: i === 0 ? C.blue2 : C.muted, cursor: "pointer",
          }}>📌 {n}</div>
        ))}
        <div style={{ fontSize: 10, fontWeight: 700, color: C.dim, letterSpacing: "0.08em", marginBottom: 6, marginTop: 12 }}>ALL NOTES</div>
        {["Interview Questions", "Career Goals 2026", "Docker Cheatsheet", "Meeting Notes"].map(n => (
          <div key={n} style={{ padding: "7px 8px", borderRadius: 8, marginBottom: 3, fontSize: 12, color: C.muted, cursor: "pointer" }}>📄 {n}</div>
        ))}
        <div style={{ fontSize: 10, fontWeight: 700, color: C.dim, letterSpacing: "0.08em", marginBottom: 6, marginTop: 12 }}>TAGS</div>
        {[["#react", C.blue], ["#learning", C.green], ["#career", C.amber]].map(([t, c]) => (
          <div key={t} style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 8px", fontSize: 11, color: c }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: c }} />
            {t}
          </div>
        ))}
      </div>

      {/* Editor */}
      <div style={{ flex: 1, background: C.surface, padding: "24px 32px", overflow: "hidden" }}>
        <div style={{ fontSize: 22, fontWeight: 800, color: C.text, marginBottom: 6, letterSpacing: "-0.02em" }}>
          React Learning Plan
        </div>
        <div style={{ display: "flex", gap: 6, marginBottom: 20 }}>
          {chip("#react",    `${C.blue}20`,  C.blue2, `${C.blue}40`)}
          {chip("#learning", `${C.green}20`, C.green, `${C.green}40`)}
        </div>
        <div style={{ fontSize: 15, fontWeight: 700, color: C.text, marginBottom: 8 }}>📚 Hooks Deep Dive</div>
        <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.7, marginBottom: 14 }}>
          Starting with <strong style={{color: C.text}}>useEffect</strong> — the most commonly misunderstood hook.
          Key insight: the dependency array controls <em>when</em> the effect runs, not <em>what</em> it captures.
        </div>
        <div style={{
          background: "#0D1830", border: `1px solid ${C.border2}`,
          borderRadius: 10, padding: "12px 14px", marginBottom: 14,
          fontFamily: "monospace",
        }}>
          <div style={{ fontSize: 10, color: C.dim, marginBottom: 6 }}>javascript</div>
          <div style={{ fontSize: 11, color: "#5B9FD4" }}>useEffect<span style={{color: C.text}}>(() =&gt; {"{"}</span></div>
          <div style={{ fontSize: 11, color: C.muted, paddingLeft: 16 }}>document.title = <span style={{color: "#1D9E75"}}>`Count: ${"{"}count{"}"}`</span>;</div>
          <div style={{ fontSize: 11, color: C.text }}>{"}"}, [count]);</div>
        </div>
        <div style={{ fontSize: 13, color: C.muted, marginBottom: 10 }}>
          Related:{" "}
          <span style={{ color: C.blue2, background: `${C.blue}15`, borderRadius: 4, padding: "1px 6px", fontSize: 12, textDecoration: "underline dotted" }}>[[useCallback vs useMemo]]</span>
          {" "}and{" "}
          <span style={{ color: C.blue2, background: `${C.blue}15`, borderRadius: 4, padding: "1px 6px", fontSize: 12, textDecoration: "underline dotted" }}>[[React Performance]]</span>
        </div>
        <div style={{
          background: `${C.amber}15`, border: `1px solid ${C.amber}30`,
          borderLeft: `4px solid ${C.amber}`, borderRadius: "0 10px 10px 0",
          padding: "10px 14px",
        }}>
          <span style={{ fontSize: 12, color: "#F5A623" }}>💡 </span>
          <span style={{ fontSize: 12, color: C.text }}>Always clean up effects that set up subscriptions or timers — return a cleanup function.</span>
        </div>
      </div>
    </div>
  )
}

// ─── 5. COURSES / STUDY PLAN ──────────────────────────────────────────────────
export function CoursesScreenshot() {
  const sections = [
    { title: "What is React?",      type: "concept",   done: true              },
    { title: "Setting up",          type: "practical", done: true              },
    { title: "JSX Deep Dive",       type: "concept",   done: true              },
    { title: "Components",          type: "practical", done: false, active: true },
    { title: "Props & State",       type: "concept",   done: false             },
    { title: "Hooks Intro",         type: "video",     done: false             },
    { title: "Practice Exercises",  type: "exercise",  done: false             },
    { title: "Topic Summary",       type: "summary",   done: false             },
  ]
  const typeColors = { concept: C.blue, practical: C.green, video: C.amber, exercise: C.purple, summary: C.muted }
  const typeLabels = { concept: "Concept", practical: "Hands-on", video: "Video", exercise: "Exercise", summary: "Summary" }

  return (
    <div style={{
      background: C.bg, borderRadius: 14, overflow: "hidden",
      border: `1px solid ${C.border2}`, fontFamily: "system-ui, sans-serif",
      aspectRatio: "16/9", display: "flex",
    }}>
      {/* Section sidebar */}
      <div style={{
        width: 220, background: C.surface2, borderRight: `1px solid ${C.border}`,
        padding: "14px 10px", flexShrink: 0,
      }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: C.text, marginBottom: 2 }}>React Fundamentals</div>
        <div style={{ fontSize: 10, color: C.muted, marginBottom: 10 }}>Beginner · Topic 2 of 8</div>
        <div style={{ background: C.surface, borderRadius: 9999, height: 5, marginBottom: 12 }}>
          <div style={{ width: "37.5%", height: "100%", background: `linear-gradient(90deg, ${C.blue}, ${C.green})`, borderRadius: 9999 }} />
        </div>
        <div style={{ fontSize: 10, fontWeight: 700, color: C.dim, letterSpacing: "0.08em", marginBottom: 6 }}>SECTIONS</div>
        {sections.map(s => (
          <div key={s.title} style={{
            display: "flex", alignItems: "center", gap: 7,
            padding: "6px 8px", borderRadius: 8, marginBottom: 2,
            background: s.active ? `${C.blue}20` : "transparent",
            border: s.active ? `1px solid ${C.blue}40` : "1px solid transparent",
          }}>
            <div style={{
              width: 14, height: 14, borderRadius: "50%", flexShrink: 0,
              background: s.done ? C.green : s.active ? C.blue : C.surface,
              border: `1.5px solid ${s.done ? C.green : s.active ? C.blue : C.border2}`,
              display: "grid", placeItems: "center", fontSize: 8, color: "white",
            }}>{s.done ? "✓" : ""}</div>
            <span style={{ fontSize: 11, color: s.active ? C.blue2 : s.done ? C.muted : C.text, flex: 1 }}>{s.title}</span>
            <div style={{
              fontSize: 9, color: typeColors[s.type],
              background: `${typeColors[s.type]}20`,
              borderRadius: 4, padding: "1px 5px",
            }}>{typeLabels[s.type]}</div>
          </div>
        ))}
      </div>

      {/* Content area */}
      <div style={{ flex: 1, padding: "24px 28px", overflow: "hidden" }}>
        <div style={{
          background: `${C.blue}10`, border: `1px solid ${C.blue}25`,
          borderRadius: 10, padding: "10px 14px", marginBottom: 16,
          display: "flex", alignItems: "flex-start", gap: 10,
        }}>
          <span style={{ fontSize: 14 }}>ℹ️</span>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.blue2, marginBottom: 4 }}>Before you start this section</div>
            <div style={{ fontSize: 11, color: C.muted }}>✓ What is React? &nbsp; ✓ Setting up your environment &nbsp; ✓ JSX syntax</div>
          </div>
        </div>
        <div style={{
          background: `linear-gradient(135deg, ${C.blue}15, transparent)`,
          border: `1px solid ${C.blue}25`, borderRadius: 10, padding: "10px 14px", marginBottom: 16,
          display: "flex", gap: 10,
        }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: C.blue, display: "grid", placeItems: "center", flexShrink: 0 }}>
            <span style={{ fontSize: 14 }}>💡</span>
          </div>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: C.blue2, letterSpacing: "0.06em" }}>REAL-WORLD APPLICATION</div>
            <div style={{ fontSize: 12, color: C.text, marginTop: 2 }}>React components are used by Facebook, Instagram, Airbnb, and Netflix to render billions of UI elements per day.</div>
          </div>
        </div>
        <div style={{ fontSize: 16, fontWeight: 700, color: C.text, marginBottom: 8 }}>Components — The Building Blocks</div>
        <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.7, marginBottom: 12 }}>
          In React, everything you see on screen is a component. A component is a JavaScript function that returns JSX — the HTML-like syntax that describes what should appear on screen.
        </div>
        <div style={{ background: C.surface2, border: `1px solid ${C.border2}`, borderRadius: 10, padding: "12px 14px" }}>
          <div style={{ fontSize: 10, color: C.dim, marginBottom: 6, fontFamily: "monospace" }}>jsx</div>
          <div style={{ fontFamily: "monospace", fontSize: 12 }}>
            <span style={{ color: "#5B9FD4" }}>function </span>
            <span style={{ color: "#F5A623" }}>Button</span>
            <span style={{ color: C.text }}>({"{"}label{"}"}) {"{"}</span>
            <br />
            <span style={{ color: C.muted, paddingLeft: 16 }}>return </span>
            <span style={{ color: "#1D9E75" }}>&lt;button&gt;</span>
            <span style={{ color: C.text }}>{"{"}label{"}"}</span>
            <span style={{ color: "#1D9E75" }}>&lt;/button&gt;</span>
            <span style={{ color: C.text }}>;</span>
            <br />
            <span style={{ color: C.text }}>{"}"}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── 6. JOBS ──────────────────────────────────────────────────────────────────
export function JobsScreenshot() {
  const jobs = [
    { title: "Senior React Developer", co: "Razorpay",  loc: "Chennai · Full-time", via: "LinkedIn", days: "2 days ago", match: 94 },
    { title: "Frontend Engineer",      co: "Freshworks", loc: "Chennai · Hybrid",    via: "Indeed",   days: "1 day ago",  match: 88 },
    { title: "Full Stack Developer",   co: "Zoho",       loc: "Remote · Full-time",  via: "Naukri",   days: "3 days ago", match: 81 },
    { title: "React Engineer",         co: "CRED",       loc: "Bangalore · On-site", via: "LinkedIn", days: "Today",      match: 76 },
  ]

  return (
    <div style={{
      background: C.bg, borderRadius: 14, overflow: "hidden",
      border: `1px solid ${C.border2}`, fontFamily: "system-ui, sans-serif",
      aspectRatio: "16/9", display: "flex", flexDirection: "column",
    }}>
      <div style={{ padding: "16px 24px", borderBottom: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 700, color: C.text }}>Jobs for you</div>
          <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>Based on: React Developer · Chennai · Updated 2h ago</div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {["All", "Full-time", "Remote", "Contract"].map((f, i) => (
            <div key={f} style={{
              padding: "4px 12px", borderRadius: 9999, fontSize: 11,
              background: i === 0 ? C.blue : "transparent",
              border: `1px solid ${i === 0 ? C.blue : C.border2}`,
              color: i === 0 ? "white" : C.muted,
            }}>{f}</div>
          ))}
        </div>
      </div>
      <div style={{ flex: 1, padding: "16px 24px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, overflow: "hidden" }}>
        {jobs.map(j => (
          <div key={j.title} style={{
            background: C.surface, border: `1px solid ${C.border2}`,
            borderRadius: 14, padding: "14px 16px",
            display: "flex", flexDirection: "column", gap: 8,
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{j.title}</div>
                <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{j.co}</div>
              </div>
              <div style={{
                background: `${C.green}20`, border: `1px solid ${C.green}40`,
                borderRadius: 8, padding: "3px 8px",
                fontSize: 12, fontWeight: 700, color: C.green,
              }}>{j.match}%</div>
            </div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {chip("📍 " + j.loc.split("·")[0].trim(), C.surface2, C.muted, C.border)}
              {chip(j.loc.split("·")[1]?.trim(), `${C.blue}15`, C.blue2, `${C.blue}30`)}
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "auto" }}>
              <span style={{ fontSize: 10, color: C.dim }}>via {j.via} · {j.days}</span>
              <div style={{ display: "flex", gap: 6 }}>
                <div style={{ background: C.blue, borderRadius: 7, padding: "4px 12px", fontSize: 11, fontWeight: 600, color: "white" }}>Apply →</div>
                <div style={{ background: C.surface2, border: `1px solid ${C.border2}`, borderRadius: 7, padding: "4px 10px", fontSize: 11, color: C.muted }}>🔖</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── 7. ATS SCORE ─────────────────────────────────────────────────────────────
export function ATSScoreScreenshot() {
  const matched = ["React", "TypeScript", "REST APIs", "Git", "Agile", "Node.js"]
  const missing = ["GraphQL", "Kubernetes", "AWS", "CI/CD"]

  return (
    <div style={{
      background: C.bg, borderRadius: 14, overflow: "hidden",
      border: `1px solid ${C.border2}`, fontFamily: "system-ui, sans-serif",
      aspectRatio: "16/9", display: "flex",
    }}>
      {/* Left — resume preview stub */}
      <div style={{
        width: "42%", background: C.surface2, borderRight: `1px solid ${C.border}`,
        padding: "20px", flexShrink: 0,
      }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: C.dim, letterSpacing: "0.06em", marginBottom: 12 }}>YOUR RESUME</div>
        <div style={{ background: "white", borderRadius: 10, padding: "14px", height: "calc(100% - 40px)", overflow: "hidden" }}>
          <div style={{ background: "linear-gradient(135deg, #185FA5, #5B9FD4)", margin: "-14px -14px 12px", padding: "12px 14px" }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: "white" }}>Alex Johnson</div>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.75)" }}>Senior React Developer</div>
          </div>
          {["Skills:", "React · TypeScript · Node.js", "REST APIs · Git · Agile", "Experience:", "6 years frontend development", "Led teams of 8 engineers"].map((line, i) => (
            <div key={i} style={{ fontSize: 10, color: i % 3 === 0 ? "#374151" : "#6B7280", fontWeight: i % 3 === 0 ? 700 : 400, marginBottom: 3 }}>{line}</div>
          ))}
        </div>
      </div>

      {/* Right — score panel */}
      <div style={{ flex: 1, padding: "20px 24px", display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>ATS Match Score</div>
            <div style={{ fontSize: 11, color: C.muted }}>Senior Full Stack Developer · Swiggy</div>
          </div>
          <div style={{ position: "relative", width: 80, height: 80 }}>
            <svg viewBox="0 0 80 80" style={{ width: 80, height: 80, transform: "rotate(-90deg)" }}>
              <circle cx="40" cy="40" r="32" fill="none" stroke={`${C.green}25`} strokeWidth="8" />
              <circle cx="40" cy="40" r="32" fill="none" stroke={C.green} strokeWidth="8"
                strokeDasharray={`${2 * Math.PI * 32 * 0.74} ${2 * Math.PI * 32}`} strokeLinecap="round" />
            </svg>
            <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: C.green }}>74%</div>
              <div style={{ fontSize: 9, color: C.muted }}>match</div>
            </div>
          </div>
        </div>
        <div style={{ background: `${C.amber}15`, border: `1px solid ${C.amber}30`, borderRadius: 10, padding: "8px 12px", display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 14 }}>⚡</span>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#F5A623" }}>Partial Match</div>
            <div style={{ fontSize: 10, color: C.muted }}>Add missing keywords to improve your score</div>
          </div>
        </div>
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, color: C.dim, letterSpacing: "0.06em", marginBottom: 6 }}>✓ MATCHED KEYWORDS ({matched.length})</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
            {matched.map(k => chip(k, `${C.green}20`, C.green, `${C.green}40`))}
          </div>
        </div>
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, color: C.dim, letterSpacing: "0.06em", marginBottom: 6 }}>✗ MISSING KEYWORDS ({missing.length})</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
            {missing.map(k => chip(k, `${C.red}15`, "#F87171", `${C.red}30`))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── 8. PORTFOLIO ─────────────────────────────────────────────────────────────
export function PortfolioScreenshot() {
  return (
    <div style={{
      background: C.bg, borderRadius: 14, overflow: "hidden",
      border: `1px solid ${C.border2}`, fontFamily: "system-ui, sans-serif",
      aspectRatio: "16/9", display: "flex",
    }}>
      {/* Left builder panel */}
      <div style={{
        width: 190, background: C.surface2, borderRight: `1px solid ${C.border}`,
        padding: "14px 10px", flexShrink: 0,
      }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: C.text, marginBottom: 4 }}>Portfolio Builder</div>
        <div style={{ fontSize: 10, color: C.muted, marginBottom: 14 }}>proflect.app/alex-johnson</div>
        <div style={{ fontSize: 10, fontWeight: 700, color: C.dim, letterSpacing: "0.06em", marginBottom: 8 }}>SECTIONS</div>
        {[
          { s: "Hero",     icon: "🏠", active: true },
          { s: "About",    icon: "👤" },
          { s: "Projects", icon: "📁" },
          { s: "Skills",   icon: "⚡" },
          { s: "Contact",  icon: "✉️" },
        ].map(({ s, icon, active }) => (
          <div key={s} style={{
            display: "flex", alignItems: "center", gap: 8, padding: "7px 8px",
            borderRadius: 8, marginBottom: 3, cursor: "pointer",
            background: active ? `${C.blue}20` : "transparent",
            border: active ? `1px solid ${C.blue}40` : "1px solid transparent",
          }}>
            <span style={{ fontSize: 13 }}>{icon}</span>
            <span style={{ fontSize: 12, color: active ? C.blue2 : C.muted }}>{s}</span>
          </div>
        ))}
        <div style={{ marginTop: 14 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: C.dim, letterSpacing: "0.06em", marginBottom: 8 }}>THEME</div>
          <div style={{ display: "flex", gap: 6 }}>
            {[C.blue, C.green, C.purple, C.amber].map(c => (
              <div key={c} style={{ width: 20, height: 20, borderRadius: 6, background: c, border: c === C.blue ? `2px solid white` : "none" }} />
            ))}
          </div>
        </div>
      </div>

      {/* Portfolio preview */}
      <div style={{ flex: 1, overflow: "hidden", background: "#0D1017" }}>
        <div style={{
          background: "linear-gradient(135deg, #0A1628 0%, #0D2137 50%, #0A1628 100%)",
          padding: "32px 32px 24px", borderBottom: `1px solid ${C.border}`,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ width: 56, height: 56, borderRadius: "50%", background: `linear-gradient(135deg, ${C.blue}, ${C.green})`, display: "grid", placeItems: "center", flexShrink: 0, fontSize: 20, fontWeight: 800, color: "white" }}>A</div>
            <div>
              <div style={{ fontSize: 22, fontWeight: 800, color: "white", letterSpacing: "-0.02em" }}>Alex Johnson</div>
              <div style={{ fontSize: 13, color: C.muted, marginTop: 2 }}>Senior React Developer · Building delightful UIs</div>
              <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
                {chip("React",      `${C.blue}25`,   C.blue2,    `${C.blue}40`)}
                {chip("TypeScript", `${C.green}20`,  C.green,    `${C.green}40`)}
                {chip("Node.js",    `${C.purple}20`, "#A78BFA",  `${C.purple}40`)}
              </div>
            </div>
          </div>
        </div>
        <div style={{ padding: "20px 24px" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 12 }}>Featured Projects</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {[
              { name: "PayFlow Dashboard", desc: "Real-time payment analytics for 50K+ merchants",       tags: ["React", "D3.js", "WebSockets"], color: C.blue  },
              { name: "CareerMap AI",      desc: "AI-powered career planning with visual path graphs",    tags: ["Next.js", "OpenAI", "Supabase"], color: C.green },
            ].map(p => (
              <div key={p.name} style={{ background: C.surface, border: `1px solid ${C.border2}`, borderRadius: 12, padding: "14px 16px" }}>
                <div style={{ height: 48, background: `linear-gradient(135deg, ${p.color}30, ${p.color}10)`, borderRadius: 8, marginBottom: 10, display: "grid", placeItems: "center" }}>
                  <div style={{ fontSize: 20 }}>🚀</div>
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{p.name}</div>
                <div style={{ fontSize: 11, color: C.muted, marginTop: 3, marginBottom: 8 }}>{p.desc}</div>
                <div style={{ display: "flex", gap: 4 }}>
                  {p.tags.map(t => <span key={t} style={{ fontSize: 9, color: C.dim, background: C.surface2, borderRadius: 4, padding: "1px 5px" }}>{t}</span>)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Component map (used by FeatureHero) ─────────────────────────────────────
export const FEATURE_SCREENSHOT_COMPONENTS = {
  "resume-builder": ResumeBuilderScreenshot,
  "portfolio":      PortfolioScreenshot,
  "career-map":     CareerMapScreenshot,
  "courses":        CoursesScreenshot,
  "interview-prep": InterviewPrepScreenshot,
  "notes":          NotesScreenshot,
  "jobs":           JobsScreenshot,
  "ats-score":      ATSScoreScreenshot,
}

// ─── Gallery (dev/preview only) ───────────────────────────────────────────────
export default function Gallery() {
  const [active, setActive] = useState("resume-builder")
  const features = Object.keys(FEATURE_SCREENSHOT_COMPONENTS)
  const ActiveScreenshot = FEATURE_SCREENSHOT_COMPONENTS[active]

  return (
    <div style={{ background: "#080F1A", minHeight: "100vh", padding: 32, fontFamily: "system-ui" }}>
      <div style={{ fontSize: 22, fontWeight: 800, color: "white", marginBottom: 24 }}>
        Proflect Feature Screenshots
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 28 }}>
        {features.map(f => (
          <button key={f} onClick={() => setActive(f)} style={{
            padding: "6px 14px", borderRadius: 8, border: "none", cursor: "pointer",
            fontSize: 12, fontWeight: 600,
            background: active === f ? "#185FA5" : "rgba(255,255,255,0.08)",
            color: active === f ? "white" : "rgba(255,255,255,0.60)",
          }}>{f.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase())}</button>
        ))}
      </div>
      <div style={{ maxWidth: 900 }}>
        <ActiveScreenshot />
      </div>
    </div>
  )
}
