// ResumeTemplatePreviews.jsx — ALL 11 TEMPLATES
// Rebuilt from actual template screenshots — accurate layouts

import { useState } from "react"

const P = {
  name: "Alex Johnson", title: "Senior React Developer",
  email: "alex@email.com", phone: "+1 (555) 234-5678", location: "San Francisco, CA",
  summary: "Full-stack developer with 6+ years building scalable React applications. Led teams of 8 engineers across fintech and e-commerce domains.",
  exp: [
    { role: "Senior React Developer", co: "Razorpay", loc: "Remote", dates: "Jan 2021 – Present",
      b: ["Built component library used by 40+ engineers","Reduced page load by 34% via code splitting","Led migration from Redux to Zustand, cutting bundle 18%","Mentored 4 junior developers quarterly"] },
    { role: "Frontend Engineer", co: "Freshworks", loc: "Chennai", dates: "Jun 2019 – Dec 2020",
      b: ["Developed 15 customer-facing features for 50K+ users","Improved test coverage from 40% to 85%","Built accessible component system with design team"] }
  ],
  edu: [{ deg: "B.S. Computer Science", inst: "Stanford University", year: "2019", detail: "GPA 3.8 · Dean's List" }],
  skills: ["React","TypeScript","Node.js","GraphQL","AWS","Docker","PostgreSQL","Redis",
           "PowerShell","Agile","Report Auto","Teams","Tech Support","Info Architecture"]
}
const tr = (s, n) => s && s.length > n ? s.slice(0, n - 1) + "…" : (s || "")

// BW initials circle shared
const BWCircle = ({ cx, cy, r = 14 }) => (
  <g>
    <circle cx={cx} cy={cy} r={r} fill="#5B7A9B" />
    <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="1" />
    <text x={cx} y={cy + 2.5} fontSize={r * 0.55} fontWeight="bold" fill="white"
      textAnchor="middle" fontFamily="Arial, sans-serif">BW</text>
  </g>
)

// ─── 1. MODERN ────────────────────────────────────────────────────────────────
// Left-aligned blue name, italic title, 2-col contact, blue section headings w/ underline
export function ModernPreview({ dark = false }) {
  const bg = dark ? "#1A2235" : "#FFFFFF"
  const tx = dark ? "rgba(255,255,255,0.90)" : "#111827"
  const mt = dark ? "rgba(255,255,255,0.55)" : "#6B7280"
  const rl = dark ? "rgba(255,255,255,0.14)" : "#C5D8EE"
  const a = "#185FA5", a2 = dark ? "#5B9FD4" : "#185FA5"
  const skills = P.skills.slice(0, 8)

  const SH = ({ x, y, label }) => (
    <g>
      <text x={x} y={y} fontSize={5.5} fontWeight="bold" fill={a2}
        fontFamily="Arial, sans-serif" letterSpacing="0.8">{label}</text>
      <rect x={x} y={y + 2} width={182} height={0.7} fill={rl} />
    </g>
  )

  return (
    <svg viewBox="0 0 210 297" xmlns="http://www.w3.org/2000/svg" style={{ width:"100%",height:"100%",display:"block" }}>
      <rect width="210" height="297" fill={bg} />
      {/* Name + title */}
      <text x={14} y={19} fontSize={12} fontWeight="bold" fill={a} fontFamily="Arial, sans-serif" letterSpacing="-0.3">{P.name}</text>
      <text x={14} y={26.5} fontSize={6.5} fontStyle="italic" fill={a2} fontFamily="Arial, sans-serif">{P.title}</text>
      {/* Contact icons */}
      <text x={14} y={33} fontSize={5} fill={mt}>✉ {P.email}</text>
      <text x={105} y={33} fontSize={5} fill={mt}>✆ {P.phone}</text>
      <text x={14} y={39} fontSize={5} fill={mt}>⊙ {P.location}</text>
      {/* Summary */}
      <SH x={14} y={46} label="SUMMARY" />
      {[tr(P.summary, 71), tr(P.summary.slice(58), 71)].map((line, i) => (
        <text key={i} x={14} y={54 + i * 6} fontSize={5} fill={mt} fontFamily="Arial, sans-serif">{line}</text>
      ))}
      {/* Experience */}
      <SH x={14} y={68} label="WORK EXPERIENCE" />
      <text x={14} y={76} fontSize={6} fontWeight="bold" fill={tx}>{P.exp[0].role}</text>
      <text x={190} y={76} fontSize={5} fill={mt} textAnchor="end">{P.exp[0].dates}</text>
      <text x={14} y={81.5} fontSize={5} fontStyle="italic" fill={a2}>{P.exp[0].co}</text>
      <text x={190} y={81.5} fontSize={5} fill={mt} textAnchor="end">{P.exp[0].loc}</text>
      {P.exp[0].b.slice(0, 4).map((b, i) => (
        <g key={i}>
          <circle cx={17} cy={87 + i * 6.5} r={0.9} fill={mt} opacity={0.8} />
          <text x={20} y={88.5 + i * 6.5} fontSize={5} fill={mt}>{tr(b, 61)}</text>
        </g>
      ))}
      <text x={14} y={116} fontSize={6} fontWeight="bold" fill={tx}>{P.exp[1].role}</text>
      <text x={190} y={116} fontSize={5} fill={mt} textAnchor="end">{P.exp[1].dates}</text>
      <text x={14} y={121.5} fontSize={5} fontStyle="italic" fill={a2}>{P.exp[1].co}</text>
      {P.exp[1].b.slice(0, 3).map((b, i) => (
        <g key={i}>
          <circle cx={17} cy={127 + i * 6.5} r={0.9} fill={mt} opacity={0.8} />
          <text x={20} y={128.5 + i * 6.5} fontSize={5} fill={mt}>{tr(b, 61)}</text>
        </g>
      ))}
      {/* Education */}
      <SH x={14} y={150} label="EDUCATION" />
      <text x={14} y={158} fontSize={6} fontWeight="bold" fill={tx}>{P.edu[0].deg}</text>
      <text x={190} y={158} fontSize={5} fill={mt} textAnchor="end">{P.edu[0].year}</text>
      <text x={14} y={163.5} fontSize={5} fontStyle="italic" fill={a2}>{P.edu[0].inst}</text>
      {/* Skills */}
      <SH x={14} y={172} label="SKILLS" />
      {skills.map((sk, i) => {
        const x = 14 + (i % 4) * 48, y = 178 + Math.floor(i / 4) * 8.5
        return <g key={sk}>
          <rect x={x} y={y - 3.5} width={43} height={5.5} rx={2.5} fill={dark ? "rgba(24,95,165,0.25)" : "#EBF3FB"} />
          <text x={x + 21.5} y={y + 0.5} fontSize={4.5} fontWeight="500" fill={a2} textAnchor="middle">{sk}</text>
        </g>
      })}
    </svg>
  )
}

// ─── 2. ATLANTIC BLUE ─────────────────────────────────────────────────────────
// Dark navy sidebar + BW circle, section headings in gray pill banner
export function AtlanticBluePreview({ dark = false }) {
  const pageBg = dark ? "#1A2235" : "#FFFFFF"
  const sb = dark ? "#0A1628" : "#1A3056"
  const a = "#5B9FD4"
  const tx = dark ? "rgba(255,255,255,0.90)" : "#111827"
  const mt = dark ? "rgba(255,255,255,0.55)" : "#6B7280"
  const rl = dark ? "rgba(255,255,255,0.14)" : "#D1DCE8"
  const bannerBg = dark ? "rgba(255,255,255,0.08)" : "#F1F5F9"

  return (
    <svg viewBox="0 0 210 297" xmlns="http://www.w3.org/2000/svg" style={{ width:"100%",height:"100%",display:"block" }}>
      <rect width="210" height="297" fill={pageBg} />
      {/* Sidebar */}
      <rect width="70" height="297" fill={sb} />
      {/* BW circle */}
      <BWCircle cx={35} cy={30} r={17} />
      {/* Sidebar name */}
      <text x={35} y={55} fontSize={6.5} fontWeight="bold" fill="rgba(255,255,255,0.90)" textAnchor="middle">{P.name.split(" ")[0]}</text>
      <text x={35} y={62} fontSize={6.5} fontWeight="bold" fill="rgba(255,255,255,0.90)" textAnchor="middle">{P.name.split(" ")[1]}</text>
      <text x={35} y={69} fontSize={4.5} fill={a} textAnchor="middle">React Developer</text>
      <rect x={8} y={72} width={54} height={0.5} fill="rgba(255,255,255,0.20)" />
      {/* Contact */}
      <text x={8} y={78} fontSize={4.5} fontWeight="bold" fill={a} letterSpacing="0.5">CONTACT</text>
      <text x={8} y={84.5} fontSize={4} fill="rgba(255,255,255,0.55)">✉ {tr(P.email, 18)}</text>
      <text x={8} y={90} fontSize={4} fill="rgba(255,255,255,0.55)">✆ {P.phone}</text>
      <text x={8} y={95.5} fontSize={4} fill="rgba(255,255,255,0.55)">⊙ {tr(P.location, 18)}</text>
      <rect x={8} y={99} width={54} height={0.5} fill="rgba(255,255,255,0.20)" />
      {/* Sidebar summary banner */}
      <rect x={8} y={102} width={54} height={7} rx={1} fill="rgba(255,255,255,0.12)" />
      <text x={35} y={107.5} fontSize={4.5} fontWeight="bold" fill={a} textAnchor="middle" letterSpacing="0.5">SUMMARY</text>
      {[P.summary.slice(0, 28), P.summary.slice(28, 56), P.summary.slice(56, 84), P.summary.slice(84, 112)].map((l, i) => (
        <text key={i} x={8} y={116 + i * 6} fontSize={4} fill="rgba(255,255,255,0.50)">{l}</text>
      ))}
      {/* Sidebar skills */}
      <rect x={8} y={143} width={54} height={0.5} fill="rgba(255,255,255,0.20)" />
      <text x={8} y={149} fontSize={4.5} fontWeight="bold" fill={a} letterSpacing="0.5">SKILLS</text>
      {P.skills.slice(0, 8).map((sk, i) => (
        <g key={sk}>
          <rect x={8} y={152 + i * 7} width={54} height={1.5} rx={0.7} fill="rgba(255,255,255,0.10)" />
          <rect x={8} y={152 + i * 7} width={[46,40,48,34,44,36,50,32][i] * 0.54 * 2} height={1.5} rx={0.7} fill={a} opacity={0.75} />
          <text x={8} y={159.5 + i * 7} fontSize={4} fill="rgba(255,255,255,0.50)">{sk}</text>
        </g>
      ))}
      {/* Main area */}
      {/* Work Experience banner */}
      <rect x={76} y={12} width={122} height={7.5} rx={1.5} fill={bannerBg} />
      <text x={137} y={17.5} fontSize={5} fontWeight="bold" fill={a} textAnchor="middle" letterSpacing="0.5">WORK EXPERIENCE</text>
      {/* Job 1 */}
      <text x={77} y={27} fontSize={6} fontWeight="bold" fill={tx}>{tr(P.exp[0].role, 30)}</text>
      <text x={77} y={33} fontSize={5} fontStyle="italic" fill={a}>{P.exp[0].co}</text>
      <text x={77} y={38.5} fontSize={4.5} fill={mt}>{P.exp[0].dates} | {P.exp[0].loc}</text>
      {P.exp[0].b.slice(0, 4).map((b, i) => (
        <g key={i}>
          <circle cx={79.5} cy={44 + i * 6.5} r={0.9} fill={mt} opacity={0.7} />
          <text x={82.5} y={45.5 + i * 6.5} fontSize={4.5} fill={mt}>{tr(b, 43)}</text>
        </g>
      ))}
      {/* Job 2 */}
      <text x={77} y={76} fontSize={6} fontWeight="bold" fill={tx}>{tr(P.exp[1].role, 30)}</text>
      <text x={77} y={82} fontSize={5} fontStyle="italic" fill={a}>{P.exp[1].co}</text>
      <text x={77} y={87.5} fontSize={4.5} fill={mt}>{P.exp[1].dates}</text>
      {P.exp[1].b.slice(0, 3).map((b, i) => (
        <g key={i}>
          <circle cx={79.5} cy={93 + i * 6.5} r={0.9} fill={mt} opacity={0.7} />
          <text x={82.5} y={94.5 + i * 6.5} fontSize={4.5} fill={mt}>{tr(b, 43)}</text>
        </g>
      ))}
      {/* Education banner */}
      <rect x={76} y={116} width={122} height={7.5} rx={1.5} fill={bannerBg} />
      <text x={137} y={121.5} fontSize={5} fontWeight="bold" fill={a} textAnchor="middle" letterSpacing="0.5">EDUCATION</text>
      <text x={77} y={131} fontSize={6} fontWeight="bold" fill={tx}>{P.edu[0].deg}</text>
      <text x={77} y={137} fontSize={5} fontStyle="italic" fill={a}>{P.edu[0].inst}</text>
      <text x={77} y={142.5} fontSize={4.5} fill={mt}>{P.edu[0].detail}</text>
    </svg>
  )
}

// ─── 3. CORPORATE ─────────────────────────────────────────────────────────────
// Centered name/title, blue rule borders, centered section headings
export function CorporatePreview({ dark = false }) {
  const bg = dark ? "#1A2235" : "#FFFFFF"
  const tx = dark ? "rgba(255,255,255,0.90)" : "#111827"
  const mt = dark ? "rgba(255,255,255,0.55)" : "#6B7280"
  const a = "#185FA5", a2 = dark ? "#5B9FD4" : "#185FA5"
  const rl = dark ? "rgba(255,255,255,0.35)" : a

  const SH = ({ y, label }) => (
    <g>
      <rect x={14} y={y} width={182} height={0.8} fill={rl} opacity={0.6} />
      <text x={105} y={y + 6} fontSize={6} fontWeight="bold" fill={a2} textAnchor="middle" letterSpacing="0.8">{label}</text>
      <rect x={14} y={y + 8} width={182} height={0.8} fill={rl} opacity={0.6} />
    </g>
  )

  return (
    <svg viewBox="0 0 210 297" xmlns="http://www.w3.org/2000/svg" style={{ width:"100%",height:"100%",display:"block" }}>
      <rect width="210" height="297" fill={bg} />
      <text x={105} y={17} fontSize={12} fontWeight="bold" fill={a} textAnchor="middle" fontFamily="Georgia, serif" letterSpacing="0.5">{P.name}</text>
      <text x={105} y={25} fontSize={6.5} fontStyle="italic" fill={a2} textAnchor="middle" fontFamily="Georgia, serif">{P.title}</text>
      {/* Contact centered */}
      <text x={105} y={32} fontSize={5} fill={mt} textAnchor="middle">⊙ {P.location}  ✉ {P.email}  ✆ {P.phone}</text>
      {/* Summary */}
      <SH y={36} label="SUMMARY" />
      {[P.summary.slice(0, 72), P.summary.slice(58, 130)].map((l, i) => (
        <text key={i} x={14} y={51 + i * 6} fontSize={5} fill={mt}>{tr(l, 72)}</text>
      ))}
      <text x={14} y={63} fontSize={5} fill={mt}>{tr(P.summary.slice(110), 72)}</text>
      {/* Work Experience */}
      <SH y={68} label="WORK EXPERIENCE" />
      <text x={14} y={83} fontSize={6} fontWeight="bold" fill={tx} fontFamily="Georgia, serif">{P.exp[0].role}</text>
      <text x={190} y={83} fontSize={5} fill={mt} textAnchor="end">{P.exp[0].dates}</text>
      <text x={14} y={88.5} fontSize={5} fontStyle="italic" fill={mt} fontFamily="Georgia, serif">{P.exp[0].co}  ·  {P.exp[0].loc}</text>
      {P.exp[0].b.slice(0, 3).map((b, i) => (
        <g key={i}>
          <circle cx={17} cy={94.5 + i * 6.5} r={0.9} fill={mt} opacity={0.8} />
          <text x={20} y={96 + i * 6.5} fontSize={5} fill={mt}>{tr(b, 62)}</text>
        </g>
      ))}
      <text x={14} y={117} fontSize={6} fontWeight="bold" fill={tx} fontFamily="Georgia, serif">{P.exp[1].role}</text>
      <text x={190} y={117} fontSize={5} fill={mt} textAnchor="end">{P.exp[1].dates}</text>
      <text x={14} y={122.5} fontSize={5} fontStyle="italic" fill={mt} fontFamily="Georgia, serif">{P.exp[1].co}  ·  {P.exp[1].loc}</text>
      {P.exp[1].b.slice(0, 2).map((b, i) => (
        <g key={i}>
          <circle cx={17} cy={128 + i * 6.5} r={0.9} fill={mt} opacity={0.8} />
          <text x={20} y={129.5 + i * 6.5} fontSize={5} fill={mt}>{tr(b, 62)}</text>
        </g>
      ))}
      {/* Education */}
      <SH y={142} label="EDUCATION" />
      <text x={14} y={157} fontSize={6} fontWeight="bold" fill={tx} fontFamily="Georgia, serif">{P.edu[0].deg}</text>
      <text x={190} y={157} fontSize={5} fill={mt} textAnchor="end">{P.edu[0].year}</text>
      <text x={14} y={162.5} fontSize={5} fontStyle="italic" fill={mt} fontFamily="Georgia, serif">{P.edu[0].inst}</text>
      {/* Skills */}
      <SH y={168} label="SKILLS" />
      {P.skills.slice(0, 8).map((sk, i) => (
        <text key={sk} x={14 + (i % 3) * 62} y={183 + Math.floor(i / 3) * 7} fontSize={5} fontWeight="600" fill={tx}>{sk}</text>
      ))}
    </svg>
  )
}

// ─── 4. ATLANTIC CREST ────────────────────────────────────────────────────────
// Full-width dark navy header with BW circle right, gray pill section labels
export function AtlanticCrestPreview({ dark = false }) {
  const pageBg = dark ? "#1A2235" : "#FFFFFF"
  const navy = "#0D1B35"
  const mt = dark ? "rgba(255,255,255,0.55)" : "#6B7280"
  const tx = dark ? "rgba(255,255,255,0.90)" : "#111827"
  const a2 = "#5B9FD4"
  const bannerBg = dark ? "rgba(255,255,255,0.08)" : "#F1F5F9"
  const bannerTx = dark ? a2 : "#185FA5"

  return (
    <svg viewBox="0 0 210 297" xmlns="http://www.w3.org/2000/svg" style={{ width:"100%",height:"100%",display:"block" }}>
      <rect width="210" height="297" fill={pageBg} />
      {/* Dark navy header */}
      <rect width="210" height="65" fill={navy} />
      {/* Name + title in header */}
      <text x={16} y={22} fontSize={11} fontWeight="bold" fill="#5B9FD4" fontFamily="Arial, sans-serif">{P.name}</text>
      <text x={16} y={31} fontSize={6} fill="#4A90C4">{P.title}</text>
      <text x={16} y={42} fontSize={4.5} fill="rgba(255,255,255,0.60)">✉ {P.email}</text>
      <text x={105} y={42} fontSize={4.5} fill="rgba(255,255,255,0.60)">✆ {P.phone}</text>
      <text x={16} y={49} fontSize={4.5} fill="rgba(255,255,255,0.60)">⊙ {P.location}</text>
      {/* BW circle right */}
      <BWCircle cx={183} cy={32} r={16} />
      {/* Body content */}
      {/* Summary */}
      <rect x={16} y={72} width={80} height={7} rx={1.5} fill={bannerBg} />
      <text x={56} y={77.5} fontSize={5} fontWeight="bold" fill={bannerTx} textAnchor="middle" letterSpacing="0.5">SUMMARY</text>
      {[P.summary.slice(0, 38), P.summary.slice(38, 76), P.summary.slice(76, 114)].map((l, i) => (
        <text key={i} x={16} y={86 + i * 6} fontSize={4.5} fill={mt}>{l}</text>
      ))}
      {/* Experience */}
      <rect x={16} y={108} width={90} height={7} rx={1.5} fill={bannerBg} />
      <text x={61} y={113.5} fontSize={5} fontWeight="bold" fill={bannerTx} textAnchor="middle" letterSpacing="0.5">WORK EXPERIENCE</text>
      <text x={16} y={122} fontSize={6} fontWeight="bold" fill={tx}>{P.exp[0].role}</text>
      <text x={16} y={128} fontSize={5} fill={a2}>{P.exp[0].co}</text>
      <text x={16} y={133.5} fontSize={4.5} fill={mt}>{P.exp[0].dates}  ·  {P.exp[0].loc}</text>
      {P.exp[0].b.slice(0, 3).map((b, i) => (
        <g key={i}><circle cx={18.5} cy={139.5 + i * 6} r={0.9} fill={mt} opacity={0.7} />
          <text x={21.5} y={141 + i * 6} fontSize={4.5} fill={mt}>{tr(b, 52)}</text></g>
      ))}
      <text x={16} y={162} fontSize={6} fontWeight="bold" fill={tx}>{P.exp[1].role}</text>
      <text x={16} y={168} fontSize={5} fill={a2}>{P.exp[1].co}</text>
      {P.exp[1].b.slice(0, 2).map((b, i) => (
        <g key={i}><circle cx={18.5} cy={174.5 + i * 6} r={0.9} fill={mt} opacity={0.7} />
          <text x={21.5} y={176 + i * 6} fontSize={4.5} fill={mt}>{tr(b, 52)}</text></g>
      ))}
    </svg>
  )
}

// ─── 5. MERCURY FLOW ──────────────────────────────────────────────────────────
// Light blue header box: BW circle left, name right. Gray pill headers. 2-col body (dates|content)
export function MercuryFlowPreview({ dark = false }) {
  const pageBg = dark ? "#1A2235" : "#FFFFFF"
  const hdrBg = dark ? "#1E2D42" : "#D6E8F7"
  const a = "#185FA5", a2 = dark ? "#5B9FD4" : "#185FA5"
  const tx = dark ? "rgba(255,255,255,0.90)" : "#111827"
  const mt = dark ? "rgba(255,255,255,0.55)" : "#6B7280"
  const bannerBg = dark ? "rgba(255,255,255,0.08)" : "#EAF1FA"

  return (
    <svg viewBox="0 0 210 297" xmlns="http://www.w3.org/2000/svg" style={{ width:"100%",height:"100%",display:"block" }}>
      <rect width="210" height="297" fill={pageBg} />
      {/* Light blue header box */}
      <rect width="210" height="56" fill={hdrBg} />
      {/* BW circle left */}
      <BWCircle cx={28} cy={28} r={18} />
      {/* Name + title right of circle */}
      <text x={54} y={21} fontSize={11} fontWeight="bold" fill={a} fontFamily="Arial, sans-serif">{P.name}</text>
      <text x={54} y={29} fontSize={6} fill={a2}>{P.title}</text>
      <text x={54} y={37} fontSize={4.5} fill={mt}>✉ {P.email}</text>
      <text x={130} y={37} fontSize={4.5} fill={mt}>✆ {P.phone}</text>
      <text x={54} y={43} fontSize={4.5} fill={mt}>⊙ {P.location}</text>
      {/* Body sections with gray pill headers + 2-col layout */}
      {/* Summary */}
      <rect x={14} y={63} width={182} height={7.5} rx={1.5} fill={bannerBg} />
      <text x={105} y={68.5} fontSize={5.5} fontWeight="bold" fill={a2} textAnchor="middle">Summary</text>
      {[P.summary.slice(0, 72), P.summary.slice(58)].map((l, i) => (
        <text key={i} x={14} y={79 + i * 6} fontSize={5} fill={mt}>{tr(l, 72)}</text>
      ))}
      {/* Work Experience */}
      <rect x={14} y={93} width={182} height={7.5} rx={1.5} fill={bannerBg} />
      <text x={105} y={98.5} fontSize={5.5} fontWeight="bold" fill={a2} textAnchor="middle">Work Experience</text>
      {/* 2-col: dates (14-52) | content (55-196) */}
      <text x={14} y={112} fontSize={4.5} fill={mt}>{P.exp[0].dates.split("–")[0]}</text>
      <text x={14} y={118} fontSize={4.5} fill={mt}>Present</text>
      <text x={14} y={124} fontSize={4.5} fill={mt}>{P.exp[0].loc}</text>
      <text x={55} y={112} fontSize={6} fontWeight="bold" fill={tx}>{P.exp[0].role}</text>
      <text x={55} y={118} fontSize={5} fill={a2}>{P.exp[0].co}</text>
      {P.exp[0].b.slice(0, 3).map((b, i) => (
        <g key={i}><circle cx={57.5} cy={124.5 + i * 6} r={0.9} fill={mt} opacity={0.7} />
          <text x={60.5} y={126 + i * 6} fontSize={4.5} fill={mt}>{tr(b, 44)}</text></g>
      ))}
      {/* Job 2 */}
      <text x={14} y={145} fontSize={4.5} fill={mt}>{P.exp[1].dates.split("–")[0]}</text>
      <text x={14} y={151} fontSize={4.5} fill={mt}>Dec 2020</text>
      <text x={14} y={157} fontSize={4.5} fill={mt}>{P.exp[1].loc}</text>
      <text x={55} y={145} fontSize={6} fontWeight="bold" fill={tx}>{P.exp[1].role}</text>
      <text x={55} y={151} fontSize={5} fill={a2}>{P.exp[1].co}</text>
      {P.exp[1].b.slice(0, 2).map((b, i) => (
        <g key={i}><circle cx={57.5} cy={157.5 + i * 6} r={0.9} fill={mt} opacity={0.7} />
          <text x={60.5} y={159 + i * 6} fontSize={4.5} fill={mt}>{tr(b, 44)}</text></g>
      ))}
      {/* Education */}
      <rect x={14} y={172} width={182} height={7.5} rx={1.5} fill={bannerBg} />
      <text x={105} y={177.5} fontSize={5.5} fontWeight="bold" fill={a2} textAnchor="middle">Education</text>
      <text x={14} y={188} fontSize={5} fill={tx} fontWeight="bold">{P.edu[0].deg}</text>
      <text x={14} y={194} fontSize={4.5} fill={a2}>{P.edu[0].inst}</text>
    </svg>
  )
}

// ─── 6. STEADY FORM ───────────────────────────────────────────────────────────
// Name + italic title inline, BW circle top-right, gray pill headers, 2-col body
export function SteadyFormPreview({ dark = false }) {
  const bg = dark ? "#1A2235" : "#FFFFFF"
  const a = "#185FA5", a2 = dark ? "#5B9FD4" : "#185FA5"
  const tx = dark ? "rgba(255,255,255,0.90)" : "#111827"
  const mt = dark ? "rgba(255,255,255,0.55)" : "#6B7280"
  const bannerBg = dark ? "rgba(255,255,255,0.08)" : "#EAF1FA"

  return (
    <svg viewBox="0 0 210 297" xmlns="http://www.w3.org/2000/svg" style={{ width:"100%",height:"100%",display:"block" }}>
      <rect width="210" height="297" fill={bg} />
      {/* Name + italic title inline */}
      <text x={14} y={21} fontSize={10} fontWeight="bold" fill={a} fontFamily="Arial, sans-serif">{P.name}</text>
      <text x={14} y={31} fontSize={7} fontStyle="italic" fill={a2}>{P.title}</text>
      {/* BW circle top-right */}
      <BWCircle cx={185} cy={22} r={16} />
      {/* Contact */}
      <text x={14} y={39} fontSize={5} fill={mt}>✉ {P.email}</text>
      <text x={105} y={39} fontSize={5} fill={mt}>✆ {P.phone}</text>
      <text x={14} y={45} fontSize={5} fill={mt}>⊙ {P.location}</text>
      {/* Summary banner */}
      <rect x={14} y={50} width={182} height={7.5} rx={1.5} fill={bannerBg} />
      <text x={105} y={55.5} fontSize={5.5} fontWeight="bold" fill={a2} textAnchor="middle">Summary</text>
      {[P.summary.slice(0, 72), P.summary.slice(58)].map((l, i) => (
        <text key={i} x={14} y={66 + i * 6} fontSize={5} fill={mt}>{tr(l, 72)}</text>
      ))}
      {/* Work Experience banner */}
      <rect x={14} y={80} width={182} height={7.5} rx={1.5} fill={bannerBg} />
      <text x={105} y={85.5} fontSize={5.5} fontWeight="bold" fill={a2} textAnchor="middle">Work Experience</text>
      {/* 2-col: dates (14-50) | content (54-196) */}
      <text x={14} y={98} fontSize={4.5} fill={mt}>Feb 2021 –</text>
      <text x={14} y={104} fontSize={4.5} fill={mt}>Present</text>
      <text x={14} y={110} fontSize={4.5} fill={mt}>{P.exp[0].loc}</text>
      <text x={54} y={98} fontSize={6} fontWeight="bold" fill={tx}>{tr(P.exp[0].role, 30)}</text>
      <text x={54} y={104} fontSize={5} fill={a2} fontStyle="italic">{P.exp[0].co}</text>
      {P.exp[0].b.slice(0, 3).map((b, i) => (
        <g key={i}><circle cx={56.5} cy={110.5 + i * 6} r={0.9} fill={mt} opacity={0.7} />
          <text x={59.5} y={112 + i * 6} fontSize={4.5} fill={mt}>{tr(b, 46)}</text></g>
      ))}
      {/* Job 2 */}
      <text x={14} y={132} fontSize={4.5} fill={mt}>Jun 2019 –</text>
      <text x={14} y={138} fontSize={4.5} fill={mt}>Dec 2020</text>
      <text x={14} y={144} fontSize={4.5} fill={mt}>{P.exp[1].loc}</text>
      <text x={54} y={132} fontSize={6} fontWeight="bold" fill={tx}>{tr(P.exp[1].role, 30)}</text>
      <text x={54} y={138} fontSize={5} fill={a2} fontStyle="italic">{P.exp[1].co}</text>
      {P.exp[1].b.slice(0, 2).map((b, i) => (
        <g key={i}><circle cx={56.5} cy={144.5 + i * 6} r={0.9} fill={mt} opacity={0.7} />
          <text x={59.5} y={146 + i * 6} fontSize={4.5} fill={mt}>{tr(b, 46)}</text></g>
      ))}
      {/* Education */}
      <rect x={14} y={160} width={182} height={7.5} rx={1.5} fill={bannerBg} />
      <text x={105} y={165.5} fontSize={5.5} fontWeight="bold" fill={a2} textAnchor="middle">Education</text>
      <text x={54} y={178} fontSize={5.5} fontWeight="bold" fill={tx}>{P.edu[0].deg}</text>
      <text x={54} y={184} fontSize={5} fill={a2}>{P.edu[0].inst}</text>
    </svg>
  )
}

// ─── 7. EXECUTIVE ─────────────────────────────────────────────────────────────
// Bold name + inline italic title, blue underline section headings, 2-col body
export function ExecutivePreview({ dark = false }) {
  const bg = dark ? "#1A2235" : "#FFFFFF"
  const a = "#185FA5", a2 = dark ? "#5B9FD4" : "#185FA5"
  const tx = dark ? "rgba(255,255,255,0.90)" : "#111827"
  const mt = dark ? "rgba(255,255,255,0.55)" : "#6B7280"
  const rl = dark ? "rgba(91,159,212,0.60)" : "#185FA5"

  const SH = ({ y, label }) => (
    <g>
      <text x={14} y={y} fontSize={7} fontWeight="bold" fill={a2} fontStyle="italic">{label}</text>
      <rect x={14} y={y + 2.5} width={182} height={0.8} fill={rl} opacity={0.5} />
    </g>
  )

  return (
    <svg viewBox="0 0 210 297" xmlns="http://www.w3.org/2000/svg" style={{ width:"100%",height:"100%",display:"block" }}>
      <rect width="210" height="297" fill={bg} />
      {/* Name + inline italic title */}
      <text x={14} y={18} fontSize={10} fontWeight="bold" fill={a} fontFamily="Arial, sans-serif">{P.name}</text>
      <text x={14} y={27} fontSize={7} fontStyle="italic" fill={a2}>{P.title}</text>
      {/* Contact */}
      <text x={14} y={35} fontSize={5} fill={mt}>⊙ {P.location}</text>
      <text x={105} y={35} fontSize={5} fill={mt}>✉ {P.email}</text>
      <text x={14} y={41} fontSize={5} fill={mt}>✆ {P.phone}</text>
      {/* Summary */}
      <SH y={49} label="Summary" />
      {[P.summary.slice(0, 72), P.summary.slice(58, 130)].map((l, i) => (
        <text key={i} x={14} y={57 + i * 6} fontSize={5} fill={mt}>{tr(l, 72)}</text>
      ))}
      <text x={14} y={69} fontSize={5} fill={mt}>{tr(P.summary.slice(110), 72)}</text>
      {/* Work Experience */}
      <SH y={77} label="Work Experience" />
      {/* 2-col: dates left, content right */}
      <text x={14} y={90} fontSize={4.5} fill={mt}>Feb 2021 –</text>
      <text x={14} y={96} fontSize={4.5} fill={mt}>Present</text>
      <text x={14} y={102} fontSize={4.5} fill={mt}>Remote</text>
      <text x={55} y={90} fontSize={6} fontWeight="bold" fill={tx}>{P.exp[0].role}</text>
      <text x={55} y={96} fontSize={5} fill={mt}>{P.exp[0].co}</text>
      {P.exp[0].b.slice(0, 3).map((b, i) => (
        <g key={i}><circle cx={57.5} cy={102.5 + i * 6} r={0.9} fill={mt} opacity={0.7} />
          <text x={60.5} y={104 + i * 6} fontSize={4.5} fill={mt}>{tr(b, 47)}</text></g>
      ))}
      <text x={14} y={124} fontSize={4.5} fill={mt}>Jun 2019 –</text>
      <text x={14} y={130} fontSize={4.5} fill={mt}>Dec 2020</text>
      <text x={14} y={136} fontSize={4.5} fill={mt}>Chennai</text>
      <text x={55} y={124} fontSize={6} fontWeight="bold" fill={tx}>{P.exp[1].role}</text>
      <text x={55} y={130} fontSize={5} fill={mt}>{P.exp[1].co}</text>
      {P.exp[1].b.slice(0, 3).map((b, i) => (
        <g key={i}><circle cx={57.5} cy={136.5 + i * 6} r={0.9} fill={mt} opacity={0.7} />
          <text x={60.5} y={138 + i * 6} fontSize={4.5} fill={mt}>{tr(b, 47)}</text></g>
      ))}
      {/* Education */}
      <SH y={158} label="Education" />
      <text x={55} y={171} fontSize={5.5} fontWeight="bold" fill={tx}>{P.edu[0].deg}</text>
      <text x={55} y={177} fontSize={5} fill={mt}>{P.edu[0].inst}</text>
    </svg>
  )
}

// ─── 8. AZURE WAVE ────────────────────────────────────────────────────────────
// Light blue wave header, TWO-COLUMN body: skills list left | summary+exp right
export function AzureWavePreview({ dark = false }) {
  const bg = dark ? "#1A2235" : "#FFFFFF"
  const hdrBg = dark ? "#1A3A5A" : "#C8DEEF"
  const a = "#185FA5", a2 = dark ? "#5B9FD4" : "#185FA5"
  const tx = dark ? "rgba(255,255,255,0.90)" : "#111827"
  const mt = dark ? "rgba(255,255,255,0.55)" : "#6B7280"

  const SH = ({ x, y, label, width = 50 }) => (
    <g>
      <text x={x} y={y} fontSize={5} fontWeight="bold" fill={a2} letterSpacing="0.6">{label}</text>
      <rect x={x} y={y + 2} width={width} height={0.5} fill={a2} opacity={0.4} />
    </g>
  )

  return (
    <svg viewBox="0 0 210 297" xmlns="http://www.w3.org/2000/svg" style={{ width:"100%",height:"100%",display:"block" }}>
      <rect width="210" height="297" fill={bg} />
      {/* Wave header */}
      <rect width="210" height="48" fill={hdrBg} />
      <path d={`M0,42 Q52,52 105,47 Q158,42 210,48 L210,48 L0,48 Z`} fill={dark ? "#1E4A7A" : "#A8C8E8"} opacity="0.5" />
      {/* Name in header */}
      <text x={14} y={18} fontSize={11} fontWeight="bold" fill={a} fontFamily="Arial, sans-serif">{P.name}</text>
      <text x={14} y={27} fontSize={6} fill={a2}>{P.title}</text>
      <text x={14} y={37} fontSize={4.5} fill={mt}>✆ {P.phone}   ✉ {P.email}   ⊙ {P.location}</text>
      {/* Left column (skills) ~40% */}
      <rect x={0} y={48} width={82} height={249} fill={dark ? "#0D1830" : "#EEF5FB"} />
      <SH x={10} y={60} label="SKILLS" width={62} />
      {P.skills.slice(0, 13).map((sk, i) => (
        <g key={sk}>
          <text x={10} y={69 + i * 9} fontSize={5} fontWeight="600" fill={tx}>{sk}</text>
          <text x={10} y={74.5 + i * 9} fontSize={4} fill={mt}>— Intermediate</text>
        </g>
      ))}
      {/* Right column */}
      <SH x={88} y={57} label="SUMMARY" width={110} />
      {[P.summary.slice(0, 45), P.summary.slice(40, 85), P.summary.slice(80)].map((l, i) => (
        <text key={i} x={88} y={65 + i * 6} fontSize={4.5} fill={mt}>{tr(l, 45)}</text>
      ))}
      <SH x={88} y={87} label="WORK EXPERIENCE" width={110} />
      <text x={88} y={97} fontSize={5.5} fontWeight="bold" fill={tx}>{tr(P.exp[0].role, 30)}</text>
      <text x={88} y={103} fontSize={4.5} fontStyle="italic" fill={a2}>{P.exp[0].co}</text>
      <text x={88} y={108.5} fontSize={4} fill={mt}>{P.exp[0].dates} | {P.exp[0].loc}</text>
      {P.exp[0].b.slice(0, 3).map((b, i) => (
        <g key={i}><circle cx={90.5} cy={114.5 + i * 6} r={0.9} fill={mt} opacity={0.7} />
          <text x={93.5} y={116 + i * 6} fontSize={4} fill={mt}>{tr(b, 38)}</text></g>
      ))}
      <text x={88} y={138} fontSize={5.5} fontWeight="bold" fill={tx}>{tr(P.exp[1].role, 30)}</text>
      <text x={88} y={144} fontSize={4.5} fontStyle="italic" fill={a2}>{P.exp[1].co}</text>
      {P.exp[1].b.slice(0, 2).map((b, i) => (
        <g key={i}><circle cx={90.5} cy={150.5 + i * 6} r={0.9} fill={mt} opacity={0.7} />
          <text x={93.5} y={152 + i * 6} fontSize={4} fill={mt}>{tr(b, 38)}</text></g>
      ))}
    </svg>
  )
}

// ─── 9. NOIR FLASH ────────────────────────────────────────────────────────────
// Black header, diagonal yellow triangle right, UPPERCASE name, BW circle
export function NoirFlashPreview({ dark = false }) {
  const bodyBg = dark ? "#0A0A0A" : "#1A1A1A"
  const a = "#F5C518" // yellow
  const mt = "rgba(255,255,255,0.50)"

  return (
    <svg viewBox="0 0 210 297" xmlns="http://www.w3.org/2000/svg" style={{ width:"100%",height:"100%",display:"block" }}>
      <rect width="210" height="297" fill={bodyBg} />
      {/* Black header */}
      <rect width="210" height="100" fill="#000000" />
      {/* Diagonal yellow triangle */}
      <path d="M140,0 L210,0 L210,100 Z" fill={a} />
      {/* BW circle */}
      <BWCircle cx={178} cy={48} r={18} />
      {/* Uppercase name */}
      <text x={12} y={36} fontSize={13} fontWeight="bold" fill="white" fontFamily="Arial Black, Arial, sans-serif" letterSpacing="1">BRUKE</text>
      <text x={12} y={52} fontSize={13} fontWeight="bold" fill="white" fontFamily="Arial Black, Arial, sans-serif" letterSpacing="1">WECHEFO</text>
      <text x={12} y={62} fontSize={5.5} fill={a}>{P.title}</text>
      {/* Contact right side */}
      <text x={198} y={74} fontSize={4.5} fill={mt} textAnchor="end">⊙ {P.location}</text>
      <text x={198} y={80} fontSize={4.5} fill={mt} textAnchor="end">✆ {P.phone}</text>
      <text x={198} y={86} fontSize={4.5} fill={mt} textAnchor="end">✉ {P.email}</text>
      {/* Body below header */}
      <text x={12} y={114} fontSize={6} fontWeight="bold" fill={a} letterSpacing="0.8">SUMMARY</text>
      <rect x={12} y={116.5} width={186} height={0.6} fill={a} opacity={0.3} />
      {[P.summary.slice(0, 52), P.summary.slice(46, 98), P.summary.slice(92, 144)].map((l, i) => (
        <text key={i} x={12} y={123 + i * 6.5} fontSize={4.5} fill={mt}>{tr(l, 52)}</text>
      ))}
      <text x={12} y={147} fontSize={6} fontWeight="bold" fill={a} letterSpacing="0.8">WORK EXPERIENCE</text>
      <rect x={12} y={149.5} width={186} height={0.6} fill={a} opacity={0.3} />
      <text x={12} y={158} fontSize={5.5} fontWeight="bold" fill="rgba(255,255,255,0.90)">{P.exp[0].role}</text>
      <text x={12} y={164} fontSize={5} fill={a} opacity={0.85}>{P.exp[0].co}</text>
      {P.exp[0].b.slice(0, 3).map((b, i) => (
        <g key={i}><rect x={12} y={169.5 + i * 6.5} width={1.8} height={1.8} rx={0.3} fill={a} opacity={0.6} />
          <text x={16} y={171 + i * 6.5} fontSize={4.5} fill={mt}>{tr(b, 62)}</text></g>
      ))}
      <text x={12} y={193} fontSize={5.5} fontWeight="bold" fill="rgba(255,255,255,0.90)">{P.exp[1].role}</text>
      <text x={12} y={199} fontSize={5} fill={a} opacity={0.85}>{P.exp[1].co}</text>
      {P.exp[1].b.slice(0, 2).map((b, i) => (
        <g key={i}><rect x={12} y={204.5 + i * 6.5} width={1.8} height={1.8} rx={0.3} fill={a} opacity={0.6} />
          <text x={16} y={206 + i * 6.5} fontSize={4.5} fill={mt}>{tr(b, 62)}</text></g>
      ))}
    </svg>
  )
}

// ─── 10. VERDANT CREST ────────────────────────────────────────────────────────
// Light green geometric header with BW circle left, green section headings
export function VerdantCrestPreview({ dark = false }) {
  const bg = dark ? "#1A2235" : "#FFFFFF"
  const hdrBg = dark ? "#1A3028" : "#C8E6D0"
  const a = "#166534", a2 = dark ? "#4ADE80" : "#166534"
  const tx = dark ? "rgba(255,255,255,0.90)" : "#111827"
  const mt = dark ? "rgba(255,255,255,0.55)" : "#6B7280"

  return (
    <svg viewBox="0 0 210 297" xmlns="http://www.w3.org/2000/svg" style={{ width:"100%",height:"100%",display:"block" }}>
      <rect width="210" height="297" fill={bg} />
      {/* Green geometric header */}
      <rect width="210" height="60" fill={hdrBg} />
      {/* Geometric shapes in header */}
      <polygon points="90,0 130,0 120,60 80,60" fill={dark ? "rgba(34,197,94,0.15)" : "rgba(34,197,94,0.20)"} />
      <polygon points="140,0 180,0 175,60 135,60" fill={dark ? "rgba(22,101,52,0.20)" : "rgba(22,101,52,0.12)"} />
      <polygon points="155,0 200,0 210,60 145,60" fill={dark ? "rgba(74,222,128,0.08)" : "rgba(134,239,172,0.30)"} />
      {/* BW circle left */}
      <BWCircle cx={28} cy={30} r={18} />
      {/* Name + title */}
      <text x={54} y={22} fontSize={11} fontWeight="bold" fill={a} fontFamily="Arial, sans-serif">{P.name}</text>
      <text x={54} y={31} fontSize={6} fill={dark ? "#4ADE80" : "#166534"}>{P.title}</text>
      {/* Contact row */}
      <text x={54} y={42} fontSize={4.5} fill={mt}>✆ {P.phone}  ✉ {P.email}  ⊙ {P.location}</text>
      {/* Body */}
      <text x={14} y={72} fontSize={6.5} fontWeight="bold" fill={a2} fontStyle="italic">Summary</text>
      {[P.summary.slice(0, 52), P.summary.slice(46, 98), P.summary.slice(92)].map((l, i) => (
        <text key={i} x={14} y={80 + i * 6.5} fontSize={4.5} fill={mt}>{tr(l, 52)}</text>
      ))}
      <text x={14} y={108} fontSize={6.5} fontWeight="bold" fill={a2} fontStyle="italic">Work Experience</text>
      <text x={14} y={117} fontSize={6} fontWeight="bold" fill={tx}>{P.exp[0].role}</text>
      <text x={14} y={123} fontSize={5} fontStyle="italic" fill={mt}>{P.exp[0].co}</text>
      <text x={14} y={128.5} fontSize={4.5} fill={mt}>{P.exp[0].dates} | {P.exp[0].loc}</text>
      {P.exp[0].b.slice(0, 3).map((b, i) => (
        <g key={i}><circle cx={16.5} cy={134.5 + i * 6.5} r={0.9} fill={a2} opacity={0.7} />
          <text x={19.5} y={136 + i * 6.5} fontSize={4.5} fill={mt}>{tr(b, 52)}</text></g>
      ))}
      <text x={14} y={158} fontSize={6} fontWeight="bold" fill={tx}>{P.exp[1].role}</text>
      <text x={14} y={164} fontSize={5} fontStyle="italic" fill={mt}>{P.exp[1].co}</text>
      <text x={14} y={169.5} fontSize={4.5} fill={mt}>{P.exp[1].dates}</text>
      {P.exp[1].b.slice(0, 2).map((b, i) => (
        <g key={i}><circle cx={16.5} cy={175.5 + i * 6.5} r={0.9} fill={a2} opacity={0.7} />
          <text x={19.5} y={177 + i * 6.5} fontSize={4.5} fill={mt}>{tr(b, 52)}</text></g>
      ))}
    </svg>
  )
}

// ─── 11. CONFETTI ─────────────────────────────────────────────────────────────
// Large pastel circles decoration, BW circle, labeled contact, colored pill headings
export function ConfettiPreview({ dark = false }) {
  const bg = dark ? "#1A2235" : "#FFFFFF"
  const a = "#185FA5", a2 = dark ? "#5B9FD4" : "#185FA5"
  const tx = dark ? "rgba(255,255,255,0.90)" : "#111827"
  const mt = dark ? "rgba(255,255,255,0.55)" : "#6B7280"
  const pill = dark ? "#6B3550" : "#F4A5A5" // salmon/pink pill
  const pillTx = dark ? "#F4A5A5" : "#7B2D42"

  const PillHeading = ({ x, y, label }) => (
    <g>
      <rect x={x} y={y - 5.5} width={label.length * 3.2 + 10} height={7} rx={3.5} fill={pill} opacity={dark ? 0.6 : 1} />
      <text x={x + 5} y={y} fontSize={5} fontWeight="bold" fill={pillTx}>{label}</text>
    </g>
  )

  return (
    <svg viewBox="0 0 210 297" xmlns="http://www.w3.org/2000/svg" style={{ width:"100%",height:"100%",display:"block" }}>
      <rect width="210" height="297" fill={bg} />
      {/* Decorative large pastel circles top-right */}
      <circle cx={170} cy={22} r={28} fill="#F4A5A5" opacity={dark ? 0.25 : 0.45} />
      <circle cx={148} cy={12} r={16} fill="#B0C4DE" opacity={dark ? 0.20 : 0.40} />
      <circle cx={190} cy={50} r={14} fill="#F4A5A5" opacity={dark ? 0.15 : 0.30} />
      <circle cx={150} cy={45} r={18} fill="#D4C5A9" opacity={dark ? 0.18 : 0.35} />
      <circle cx={172} cy={66} r={20} fill="#D4C5A9" opacity={dark ? 0.15 : 0.28} />
      {/* BW circle — overlapping the decorative circles */}
      <BWCircle cx={170} cy={35} r={18} />
      {/* Name */}
      <text x={14} y={21} fontSize={11} fontWeight="bold" fill={a} fontFamily="Arial, sans-serif">{P.name}</text>
      {/* Contact with labels */}
      <text x={14} y={32} fontSize={5} fill={mt}><tspan fontWeight="bold" fill={tx}>Address:</tspan> {P.location}</text>
      <text x={14} y={39} fontSize={5} fill={mt}><tspan fontWeight="bold" fill={tx}>Phone:</tspan> {P.phone}</text>
      <text x={14} y={46} fontSize={5} fill={mt}><tspan fontWeight="bold" fill={tx}>Email:</tspan> {P.email}</text>
      {/* Summary pill heading */}
      <PillHeading x={14} y={58} label="Summary" />
      {[P.summary.slice(0, 50), P.summary.slice(44, 94), P.summary.slice(88, 138)].map((l, i) => (
        <text key={i} x={14} y={67 + i * 6.5} fontSize={4.5} fill={mt}>{tr(l, 50)}</text>
      ))}
      {/* Work Experience pill heading */}
      <PillHeading x={14} y={92} label="Work Experience" />
      <text x={14} y={102} fontSize={6} fontWeight="bold" fill={tx}>{P.exp[0].role}</text>
      <text x={14} y={108} fontSize={5} fill={mt}><tspan fontWeight="bold">Company:</tspan> {P.exp[0].co}</text>
      {P.exp[0].b.slice(0, 3).map((b, i) => (
        <g key={i}><circle cx={16.5} cy={114.5 + i * 6.5} r={0.9} fill={mt} opacity={0.7} />
          <text x={19.5} y={116 + i * 6.5} fontSize={4.5} fill={mt}>{tr(b, 50)}</text></g>
      ))}
      <text x={14} y={138} fontSize={6} fontWeight="bold" fill={tx}>{P.exp[1].role}</text>
      <text x={14} y={144} fontSize={5} fill={mt}><tspan fontWeight="bold">Company:</tspan> {P.exp[1].co}</text>
      {P.exp[1].b.slice(0, 2).map((b, i) => (
        <g key={i}><circle cx={16.5} cy={150.5 + i * 6.5} r={0.9} fill={mt} opacity={0.7} />
          <text x={19.5} y={152 + i * 6.5} fontSize={4.5} fill={mt}>{tr(b, 50)}</text></g>
      ))}
      {/* Education */}
      <PillHeading x={14} y={170} label="Education" />
      <text x={14} y={180} fontSize={5.5} fontWeight="bold" fill={tx}>{P.edu[0].deg}</text>
      <text x={14} y={186} fontSize={5} fill={mt}>{P.edu[0].inst}</text>
    </svg>
  )
}

// ─── Spotlight preview ────────────────────────────────────────────────────────
function SpotlightPreview() {
  const accent = "#185FA5";
  const chipStyle = { display:"inline-block", padding:"2px 7px", borderRadius:6, background:accent+"14", color:accent, fontSize:6.5, fontWeight:500, margin:"2px 2px 0 0" };
  const Heading = ({ label }) => (
    <div style={{ marginTop:8, marginBottom:3 }}>
      <div style={{ fontSize:7, fontWeight:800, letterSpacing:"0.12em", textTransform:"uppercase", color:accent }}>{label}</div>
      <div style={{ height:2, width:18, borderRadius:1, background:accent, marginTop:2 }} />
    </div>
  );
  return (
    <div style={{ fontFamily:"Inter,sans-serif", fontSize:8 }}>
      <div style={{ background:accent, padding:"14px 13px 10px" }}>
        <div style={{ fontSize:22, fontWeight:800, letterSpacing:"-0.02em", lineHeight:1, color:"#fff" }}>Alex Johnson</div>
        <div style={{ fontSize:9.5, fontWeight:500, color:"rgba(255,255,255,0.82)", marginTop:3 }}>Senior React Developer</div>
        <div style={{ display:"flex", flexWrap:"wrap", gap:"3px 10px", marginTop:6 }}>
          {["✉ alex@email.com","☏ +1 555 234-5678","⌖ San Francisco, CA"].map((c,i) => (
            <span key={i} style={{ fontSize:7.5, color:"rgba(255,255,255,0.88)" }}>{c}</span>
          ))}
        </div>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"1.6fr 1fr", gap:10, padding:"8px 13px" }}>
        <div>
          <Heading label="Summary" />
          <div style={{ fontSize:6.5, color:"#374151", lineHeight:1.5 }}>Full-stack developer with 6+ years building scalable React apps across fintech and e-commerce.</div>
          <Heading label="Work Experience" />
          <div style={{ marginBottom:5 }}>
            <div style={{ fontSize:7.5, fontWeight:700 }}>Senior React Developer</div>
            <div style={{ fontSize:7, fontStyle:"italic", color:"#6B7280" }}>Razorpay</div>
            <div style={{ fontSize:6.5, color:"#9097A3", marginBottom:1 }}>Jan 2021 – Present</div>
            <div style={{ fontSize:6.5, color:"#374151", paddingLeft:8 }}>• Built component library used by 40+ engineers</div>
            <div style={{ fontSize:6.5, color:"#374151", paddingLeft:8 }}>• Reduced page load by 34% via code splitting</div>
          </div>
          <Heading label="Education" />
          <div style={{ fontSize:7.5, fontWeight:700 }}>B.S. Computer Science</div>
          <div style={{ fontSize:7, color:"#6B7280" }}>Stanford University</div>
        </div>
        <div>
          <Heading label="Skills" />
          <div>{["React","TypeScript","Node.js","GraphQL","AWS","Redux","Tailwind"].map(s=><span key={s} style={chipStyle}>{s}</span>)}</div>
          <Heading label="Languages" />
          {[["English","Native"],["Hindi","Fluent"],["Spanish","Intermediate"]].map(([lang,level])=>(
            <div key={lang} style={{ display:"flex", justifyContent:"space-between", fontSize:7, color:"#374151", marginBottom:2 }}>
              <span>{lang}</span><span style={{ color:"#9097A3" }}>{level}</span>
            </div>
          ))}
          <Heading label="Interests" />
          {["Open Source","Running","Design"].map(s=><span key={s} style={chipStyle}>{s}</span>)}
        </div>
      </div>
    </div>
  );
}

// ─── Index preview ────────────────────────────────────────────────────────────
function IndexPreview() {
  const accent = "#185FA5";
  const NumHeading = ({ n, label }) => (
    <div style={{ display:"grid", gridTemplateColumns:"30px 1fr", gap:8, alignItems:"baseline", marginTop:10, marginBottom:4 }}>
      <div style={{ fontSize:12, fontWeight:800, color:accent, lineHeight:1, letterSpacing:"-0.02em" }}>{String(n).padStart(2,"0")}</div>
      <div>
        <div style={{ fontSize:7, fontWeight:700, letterSpacing:"0.18em", textTransform:"uppercase", color:"#16181D" }}>{label}</div>
        <div style={{ height:1, background:"#D7DBE2", marginTop:3 }} />
      </div>
    </div>
  );
  const Body = ({ children }) => (
    <div style={{ display:"grid", gridTemplateColumns:"30px 1fr", gap:8 }}><div /><div style={{ minWidth:0 }}>{children}</div></div>
  );
  return (
    <div style={{ fontFamily:"Inter,sans-serif", padding:"14px 13px" }}>
      <div style={{ fontSize:26, fontWeight:800, letterSpacing:"-0.035em", lineHeight:0.95, color:"#16181D" }}>Alex Johnson</div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end", flexWrap:"wrap", gap:8, marginTop:6 }}>
        <div style={{ fontSize:9, fontWeight:500, color:accent }}>Senior React Developer</div>
        <div style={{ display:"flex", gap:8, fontSize:7, color:"#9097A3" }}>
          <span>alex@email.com</span><span>+1 555 234-5678</span><span>San Francisco</span>
        </div>
      </div>
      <div style={{ height:2, background:"#16181D", marginTop:7 }} />
      <NumHeading n={1} label="Summary" />
      <Body><div style={{ fontSize:7, color:"#374151", lineHeight:1.6 }}>Full-stack developer with 6+ years building scalable React applications across fintech.</div></Body>
      <NumHeading n={2} label="Work Experience" />
      <Body>
        <div style={{ display:"grid", gridTemplateColumns:"64px 1fr", gap:8, marginBottom:4 }}>
          <div style={{ fontSize:7, color:"#374151" }}><div>Jan 2021 – Now</div><div style={{ color:"#9097A3" }}>Remote</div></div>
          <div>
            <div style={{ fontSize:7.5, fontWeight:700, color:"#16181D" }}>Senior React Developer</div>
            <div style={{ fontSize:7, color:"#6B7280" }}>Razorpay</div>
            <div style={{ fontSize:6.5, color:"#374151", paddingLeft:8 }}>• Built component library used by 40+ engineers</div>
          </div>
        </div>
      </Body>
      <NumHeading n={3} label="Skills" />
      <Body>
        <div style={{ fontSize:7.5, lineHeight:1.7, color:"#374151" }}>
          {["React","TypeScript","Node.js","GraphQL","AWS","Redux"].map((s,i,arr)=>(
            <span key={s}><span style={{ whiteSpace:"nowrap" }}>{s}</span>{i<arr.length-1&&<span style={{ color:accent, margin:"0 4px", fontWeight:700 }}>/</span>}</span>
          ))}
        </div>
      </Body>
      <NumHeading n={4} label="Education" />
      <Body>
        <div style={{ display:"grid", gridTemplateColumns:"64px 1fr", gap:8 }}>
          <div style={{ fontSize:7, color:"#374151" }}>2015 – 2019</div>
          <div>
            <div style={{ fontSize:7.5, fontWeight:700, color:"#16181D" }}>B.S. Computer Science</div>
            <div style={{ fontSize:7, color:"#6B7280" }}>Stanford University</div>
          </div>
        </div>
      </Body>
    </div>
  );
}

// ─── Panels preview ───────────────────────────────────────────────────────────
function PanelsPreview() {
  const accent = "#185FA5";
  const Pill = ({ children }) => (
    <div style={{ display:"inline-block", whiteSpace:"nowrap", padding:"2px 8px", borderRadius:999, background:accent+"14", color:accent, fontSize:6.5, fontWeight:800, letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:4 }}>{children}</div>
  );
  const SkillChip = ({ label }) => (
    <span style={{ padding:"2px 7px", borderRadius:6, background:"#F2F4F8", border:"1px solid #E6E9EF", fontSize:6.5, fontWeight:500, color:"#374151", margin:"2px 2px 0 0", display:"inline-block" }}>{label}</span>
  );
  const SideCard = ({ children }) => (
    <div style={{ background:"#F7F8FB", border:"1px solid #ECEEF3", borderRadius:9, padding:"8px 9px", marginBottom:7 }}>{children}</div>
  );
  return (
    <div style={{ fontFamily:"Inter,sans-serif", padding:12 }}>
      <div style={{ background:accent+"0F", border:`1px solid ${accent}22`, borderRadius:10, padding:"10px 11px" }}>
        <div style={{ fontSize:18, fontWeight:800, letterSpacing:"-0.02em", lineHeight:1, color:"#1E222B" }}>Alex Johnson</div>
        <div style={{ fontSize:9, fontWeight:500, color:accent, marginTop:2 }}>Senior React Developer</div>
        <div style={{ display:"flex", flexWrap:"wrap", gap:5, marginTop:7 }}>
          {["✉ alex@email.com","☏ +1 555 234-5678","⌖ San Francisco"].map((c,i)=>(
            <div key={i} style={{ display:"inline-flex", alignItems:"center", gap:3, padding:"2px 7px", borderRadius:999, background:"#fff", border:"1px solid #E6E9EF", fontSize:7, color:"#374151" }}>{c}</div>
          ))}
        </div>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"1.55fr 1fr", gap:10, marginTop:10 }}>
        <div>
          <Pill>Summary</Pill>
          <div style={{ fontSize:6.5, color:"#374151", lineHeight:1.5, marginBottom:7 }}>Full-stack developer with 6+ years building scalable React applications across fintech.</div>
          <Pill>Work Experience</Pill>
          <div style={{ marginBottom:5 }}>
            <div style={{ fontSize:7.5, fontWeight:700, color:"#1E222B" }}>Senior React Developer</div>
            <div style={{ fontSize:7, fontStyle:"italic", color:"#6B7280" }}>Razorpay</div>
            <div style={{ fontSize:6.5, color:"#9097A3" }}>Jan 2021 – Present</div>
            <div style={{ fontSize:6.5, color:"#374151", paddingLeft:8 }}>• Built component library used by 40+ engineers</div>
            <div style={{ fontSize:6.5, color:"#374151", paddingLeft:8 }}>• Reduced page load by 34% via code splitting</div>
          </div>
          <div>
            <div style={{ fontSize:7.5, fontWeight:700, color:"#1E222B" }}>Frontend Engineer</div>
            <div style={{ fontSize:7, fontStyle:"italic", color:"#6B7280" }}>Freshworks</div>
            <div style={{ fontSize:6.5, color:"#9097A3" }}>Jun 2019 – Dec 2020</div>
            <div style={{ fontSize:6.5, color:"#374151", paddingLeft:8 }}>• Developed 15 customer-facing features</div>
          </div>
        </div>
        <div>
          <SideCard><Pill>Skills</Pill><div style={{ marginTop:2 }}>{["React","TypeScript","Node.js","GraphQL","AWS","Redux"].map(s=><SkillChip key={s} label={s} />)}</div></SideCard>
          <SideCard>
            <Pill>Languages</Pill>
            {[["English","Native"],["Hindi","Fluent"]].map(([l,v])=>(
              <div key={l} style={{ display:"flex", justifyContent:"space-between", fontSize:7, color:"#374151", lineHeight:2 }}><span>{l}</span><span style={{ color:"#9097A3" }}>{v}</span></div>
            ))}
          </SideCard>
          <SideCard>
            <Pill>Education</Pill>
            <div style={{ fontSize:7, fontWeight:700, color:"#374151", marginTop:2 }}>B.S. Computer Science</div>
            <div style={{ fontSize:6.5, color:"#6B7280" }}>Stanford University · 2019</div>
          </SideCard>
        </div>
      </div>
    </div>
  );
}

// ─── Vertex preview ───────────────────────────────────────────────────────────
function VertexPreview() {
  const accent = "#185FA5";
  const RailHead = ({ children }) => (
    <div style={{ marginTop:10, marginBottom:4 }}>
      <div style={{ fontSize:6.5, fontWeight:800, letterSpacing:"0.16em", textTransform:"uppercase", color:"rgba(255,255,255,0.95)" }}>{children}</div>
      <div style={{ height:2, width:14, background:"rgba(255,255,255,0.5)", marginTop:2 }} />
    </div>
  );
  const Ring = ({ pct, label }) => (
    <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:5 }}>
      <div style={{ position:"relative", width:26, height:26, borderRadius:"50%", background:`conic-gradient(#fff ${pct}%, rgba(255,255,255,0.22) 0)`, display:"grid", placeItems:"center", flexShrink:0 }}>
        <div style={{ width:"70%", height:"70%", borderRadius:"50%", background:accent, display:"grid", placeItems:"center", fontSize:5.5, fontWeight:800, color:"#fff" }}>{pct}%</div>
      </div>
      <div style={{ fontSize:7, color:"#fff" }}>{label}</div>
    </div>
  );
  const MainHead = ({ children }) => (
    <div style={{ display:"flex", alignItems:"center", gap:6, marginTop:11, marginBottom:4 }}>
      <span style={{ fontSize:7, fontWeight:800, letterSpacing:"0.14em", textTransform:"uppercase", color:accent, whiteSpace:"nowrap" }}>{children}</span>
      <span style={{ flex:1, height:1, background:"#E2E5EB" }} />
    </div>
  );
  return (
    <div style={{ fontFamily:"Inter,sans-serif", display:"grid", gridTemplateColumns:"1fr 34%", height:"100%" }}>
      <div style={{ padding:"14px 13px" }}>
        <div style={{ fontSize:20, fontWeight:800, letterSpacing:"-0.025em", lineHeight:1, color:"#1A1D24" }}>Alex Johnson</div>
        <div style={{ fontSize:9, fontWeight:500, color:accent, marginTop:4 }}>Senior React Developer</div>
        <MainHead>Summary</MainHead>
        <div style={{ fontSize:6.5, color:"#374151", lineHeight:1.5 }}>Full-stack developer with 6+ years building scalable React apps across fintech and e-commerce.</div>
        <MainHead>Work Experience</MainHead>
        <div style={{ marginBottom:5 }}>
          <div style={{ fontSize:7.5, fontWeight:700, color:"#1A1D24" }}>Senior React Developer</div>
          <div style={{ fontSize:7, fontStyle:"italic", color:"#6B7280" }}>Razorpay</div>
          <div style={{ fontSize:6.5, color:"#9097A3" }}>Jan 2021 – Present · Remote</div>
          <div style={{ fontSize:6.5, color:"#374151", paddingLeft:8 }}>• Built component library used by 40+ engineers</div>
          <div style={{ fontSize:6.5, color:"#374151", paddingLeft:8 }}>• Reduced page load by 34% via code splitting</div>
        </div>
        <MainHead>Education</MainHead>
        <div style={{ fontSize:7.5, fontWeight:700, color:"#1A1D24" }}>B.S. Computer Science</div>
        <div style={{ fontSize:7, color:"#6B7280" }}>Stanford University · 2015–2019</div>
      </div>
      <div style={{ background:accent, padding:"14px 10px" }}>
        <div style={{ display:"flex", justifyContent:"center", marginBottom:10 }}>
          <div style={{ width:44, height:44, borderRadius:"50%", background:"rgba(255,255,255,0.22)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, fontWeight:700, color:"#fff", border:"2px solid rgba(255,255,255,0.4)" }}>AJ</div>
        </div>
        <RailHead>Contact</RailHead>
        {["✉ alex@email.com","☏ +1 555 234-5678","⌖ San Francisco"].map((c,i)=>(
          <div key={i} style={{ fontSize:6.5, color:"rgba(255,255,255,0.88)", marginBottom:3, lineHeight:1.4 }}>{c}</div>
        ))}
        <RailHead>Skills</RailHead>
        <Ring pct={100} label="React" />
        <Ring pct={87} label="TypeScript" />
        <Ring pct={67} label="GraphQL" />
        <Ring pct={53} label="AWS" />
      </div>
    </div>
  );
}

// ─── MASTER MAP — 15 templates ────────────────────────────────────────────────
export const TEMPLATE_PREVIEWS = {
  "modern":          { label:"Modern",         style:"Clean",      component:ModernPreview },
  "atlantic-blue":   { label:"Atlantic Blue",  style:"Classic",    component:AtlanticBluePreview },
  "corporate":       { label:"Corporate",      style:"Serif",      component:CorporatePreview },
  "atlantic-crest":  { label:"Atlantic Crest", style:"Navy/Bold",  component:AtlanticCrestPreview },
  "mercury-flow":    { label:"Mercury Flow",   style:"Minimal",    component:MercuryFlowPreview },
  "steady-form":     { label:"Steady Form",    style:"Structured", component:SteadyFormPreview },
  "executive":       { label:"Executive",      style:"Classic",    component:ExecutivePreview },
  "azure-wave":      { label:"Azure Wave",     style:"Two-Column", component:AzureWavePreview },
  "noir-flash":      { label:"Noir Flash",     style:"Bold",       component:NoirFlashPreview },
  "verdant-crest":   { label:"Verdant Crest",  style:"Fresh",      component:VerdantCrestPreview },
  "confetti":        { label:"Confetti",       style:"Creative",   component:ConfettiPreview },
  "spotlight":       { label:"Spotlight",      style:"Modern",     component:SpotlightPreview },
  "index":           { label:"Index",          style:"Clean",      component:IndexPreview },
  "panels":          { label:"Panels",         style:"Creative",   component:PanelsPreview },
  "vertex":          { label:"Vertex",         style:"Creative",   component:VertexPreview },
}

// ─── Gallery ──────────────────────────────────────────────────────────────────
export default function TemplatePreviewGallery() {
  const [dark, setDark]         = useState(false)
  const [selected, setSelected] = useState("modern")
  const templates = Object.entries(TEMPLATE_PREVIEWS)
  return (
    <div style={{ background:dark?"#0A1628":"#F4F8FC", minHeight:"100vh", padding:28, fontFamily:"system-ui,sans-serif" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:24 }}>
        <div style={{ fontSize:18, fontWeight:700, color:dark?"white":"#0A1628" }}>Resume Templates ({templates.length})</div>
        <button onClick={()=>setDark(d=>!d)} style={{ padding:"6px 16px", borderRadius:8, border:"none", background:dark?"rgba(255,255,255,0.12)":"rgba(0,0,0,0.08)", color:dark?"white":"#374151", fontSize:13, fontWeight:600, cursor:"pointer" }}>
          {dark?"☀ Light":"☾ Dark"}
        </button>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:20 }}>
        {templates.map(([id,t]) => {
          const Comp = t.component
          const isActive = selected === id
          return (
            <div key={id} onClick={()=>setSelected(id)} style={{
              background:dark?"#111F35":"white", borderRadius:14, overflow:"hidden", cursor:"pointer",
              border:isActive?`2px solid ${dark?"#5B9FD4":"#185FA5"}`:`1px solid ${dark?"rgba(255,255,255,0.10)":"#D1DCE8"}`,
              transition:"all 160ms",
            }}>
              <div style={{ background:dark?"#0A1220":"#EEF2F6", padding:"10px 10px 6px" }}>
                <div style={{ borderRadius:8, overflow:"hidden", aspectRatio:"210/297" }}>
                  <Comp dark={dark} />
                </div>
              </div>
              <div style={{ padding:"10px 14px 12px", display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                <div>
                  <div style={{ fontSize:13, fontWeight:700, color:dark?"#E8EFF7":"#0A1628", marginBottom:2 }}>{t.label}</div>
                  <div style={{ fontSize:11, color:dark?"#8BA3C1":"#6B7280" }}>{t.style} · free</div>
                </div>
                {isActive && <div style={{ background:dark?"rgba(91,159,212,0.20)":"rgba(24,95,165,0.10)", color:dark?"#5B9FD4":"#185FA5", borderRadius:20, padding:"3px 10px", fontSize:11, fontWeight:600 }}>★ Selected</div>}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
