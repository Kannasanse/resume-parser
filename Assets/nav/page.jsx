// Fake page content + popovers + mobile drawer
// Used to fill artboard frames so the navigation is shown in real context.

const PageMyCourses = () => (
  <div style={{ padding: '24px 32px', fontFamily: 'Inter, system-ui, sans-serif' }}>
    <style>{`
      .pmc-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px; margin-top: 20px; }
      .pmc-card { background: #fff; border: 1px solid #D1DCE8; border-radius: 14px; padding: 18px; box-shadow: 0 1px 2px rgba(12,68,124,0.04); }
      .pmc-card-head { display: flex; align-items: center; gap: 10px; margin-bottom: 12px; }
      .pmc-card-icon { width: 36px; height: 36px; border-radius: 10px; display: grid; place-items: center; color: #fff; flex-shrink: 0; }
      .pmc-card-title { font-size: 15px; font-weight: 700; color: #2C2C2A; letter-spacing: -0.01em; line-height: 1.3; }
      .pmc-card-meta { font-size: 12px; color: #9CA3AF; margin-top: 2px; }
      .pmc-progress { height: 6px; background: #F4F8FC; border-radius: 99px; overflow: hidden; margin: 10px 0 8px; }
      .pmc-progress-fill { height: 100%; background: linear-gradient(90deg, #185FA5, #1D9E75); border-radius: 99px; }
      .pmc-card-foot { display: flex; align-items: center; justify-content: space-between; font-size: 12px; color: #6B7280; margin-top: 8px; }
      .pmc-pill { font-size: 11px; font-weight: 600; padding: 2px 8px; border-radius: 999px; }
    `}</style>
    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 4 }}>
      <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.02em', margin: 0, color: '#2C2C2A' }}>My Courses</h1>
      <button style={{ background: '#185FA5', color: '#fff', border: 'none', borderRadius: 10, padding: '8px 14px', fontSize: 13, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontFamily: 'inherit' }}>
        <NavIcon name="plus" size={14} color="#fff" />
        New study plan
      </button>
    </div>
    <p style={{ fontSize: 14, color: '#6B7280', margin: 0 }}>6 active plans · 142 hours of study material</p>
    <div className="pmc-grid">
      {[
        { title: 'Python & Docker for Backend Engineers', meta: '12 topics · 18h estimated', pct: 62, color: '#185FA5', tag: 'IN PROGRESS', tagColor: '#185FA5', tagBg: '#E6F1FB' },
        { title: 'System Design Interview Prep', meta: '8 topics · 24h estimated', pct: 35, color: '#1D9E75', tag: 'IN PROGRESS', tagColor: '#185FA5', tagBg: '#E6F1FB' },
        { title: 'React Advanced Patterns', meta: '10 topics · 16h estimated', pct: 100, color: '#0C447C', tag: 'COMPLETED', tagColor: '#1D9E75', tagBg: '#D1FAE5' },
        { title: 'AWS Solutions Architect', meta: '14 topics · 32h estimated', pct: 18, color: '#185FA5', tag: 'IN PROGRESS', tagColor: '#185FA5', tagBg: '#E6F1FB' },
        { title: 'PostgreSQL Performance', meta: '6 topics · 12h estimated', pct: 78, color: '#1D9E75', tag: 'IN PROGRESS', tagColor: '#185FA5', tagBg: '#E6F1FB' },
        { title: 'TypeScript Deep Dive', meta: '9 topics · 14h estimated', pct: 100, color: '#0C447C', tag: 'COMPLETED', tagColor: '#1D9E75', tagBg: '#D1FAE5' },
      ].map((c, i) => (
        <div key={i} className="pmc-card">
          <div className="pmc-card-head">
            <div className="pmc-card-icon" style={{ background: `linear-gradient(135deg, ${c.color}, #0C447C)` }}>
              <NavIcon name="bookOpen" size={18} color="#fff" />
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div className="pmc-card-title">{c.title}</div>
              <div className="pmc-card-meta">{c.meta}</div>
            </div>
          </div>
          <div className="pmc-progress">
            <div className="pmc-progress-fill" style={{ width: c.pct + '%' }} />
          </div>
          <div className="pmc-card-foot">
            <span>{c.pct}% complete</span>
            <span className="pmc-pill" style={{ background: c.tagBg, color: c.tagColor }}>{c.tag}</span>
          </div>
        </div>
      ))}
    </div>
  </div>
);

// User dropdown popover (anchored from sidebar footer avatar or top-bar avatar)
const UserDropdown = () => (
  <div style={{
    width: 240, background: '#fff', border: '1px solid #D1DCE8',
    borderRadius: 14, boxShadow: '0 16px 40px rgba(12,68,124,0.18)',
    padding: 8, fontFamily: 'Inter, system-ui, sans-serif',
  }}>
    <style>{`
      .udd-item { display: flex; align-items: center; gap: 10px; height: 36px; padding: 0 10px; border-radius: 8px; font-size: 14px; color: #2C2C2A; cursor: pointer; transition: background 120ms; }
      .udd-item:hover { background: rgba(24,95,165,0.06); }
      .udd-item-danger { color: #D93025; }
      .udd-item-danger:hover { background: rgba(217,48,37,0.08); }
      .udd-divider { height: 1px; background: #D1DCE8; margin: 6px 0; }
      .udd-kbd { margin-left: auto; font-family: 'JetBrains Mono', monospace; font-size: 10px; color: #9CA3AF; background: #F4F8FC; padding: 2px 6px; border-radius: 4px; border: 1px solid #D1DCE8; }
    `}</style>
    <div style={{ background: '#F4F8FC', borderRadius: 10, padding: '10px 12px', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 10 }}>
      <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, #185FA5, #0C447C)', color: '#fff', display: 'grid', placeItems: 'center', fontSize: 13, fontWeight: 700, flexShrink: 0 }}>KT</div>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#2C2C2A', lineHeight: 1.2 }}>Karthik Tadepalli</div>
        <div style={{ fontSize: 11, color: '#6B7280', lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>karthik@revature.com</div>
      </div>
    </div>
    <div className="udd-item"><NavIcon name="settings" size={16} color="#6B7280" />Profile settings</div>
    <div className="udd-item"><NavIcon name="receipt" size={16} color="#6B7280" />Billing & credits</div>
    <div className="udd-item">
      <NavIcon name="keyboard" size={16} color="#6B7280" />
      Keyboard shortcuts
      <span className="udd-kbd">⌘?</span>
    </div>
    <div className="udd-divider" />
    <div className="udd-item udd-item-danger">
      <NavIcon name="logout" size={16} color="#D93025" />
      Sign out
    </div>
  </div>
);

// Mobile drawer
const MobileDrawer = ({ activeId = 'my-courses' }) => (
  <div style={{ position: 'relative', width: '100%', height: '100%', background: 'rgba(12,22,40,0.45)', fontFamily: 'Inter, system-ui, sans-serif' }}>
    <div style={{ position: 'absolute', inset: 0, left: 0, width: 280, background: '#fff', boxShadow: '4px 0 24px rgba(0,0,0,0.18)' }}>
      <Sidebar collapsed={false} activeId={activeId} />
    </div>
    {/* Close button */}
    <button style={{ position: 'absolute', top: 16, left: 280 + 12, width: 36, height: 36, borderRadius: 999, background: '#fff', border: 'none', display: 'grid', placeItems: 'center', cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.18)' }}>
      <NavIcon name="close" size={18} color="#2C2C2A" />
    </button>
  </div>
);

// Mobile top bar (compact)
const MobileTopBar = () => (
  <header style={{ height: 56, background: '#fff', borderBottom: '1px solid #D1DCE8', display: 'flex', alignItems: 'center', padding: '0 12px', gap: 8, fontFamily: 'Inter, system-ui, sans-serif' }}>
    <button style={{ width: 36, height: 36, border: 'none', background: 'none', display: 'grid', placeItems: 'center', cursor: 'pointer', color: '#2C2C2A' }}>
      <NavIcon name="menu" size={20} />
    </button>
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ width: 28, height: 28, borderRadius: 8, background: 'linear-gradient(135deg, #185FA5, #0C447C)', display: 'grid', placeItems: 'center' }}>
        <NavIcon name="shield" size={16} color="#fff" />
      </div>
      <div style={{ fontSize: 16, fontWeight: 800, letterSpacing: '-0.02em' }}>Proflect</div>
    </div>
    <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 4 }}>
      <button style={{ width: 36, height: 36, border: 'none', background: 'none', display: 'grid', placeItems: 'center', cursor: 'pointer', color: '#6B7280' }}>
        <NavIcon name="search" size={18} />
      </button>
      <div style={{ width: 28, height: 28, borderRadius: 999, background: 'linear-gradient(135deg, #185FA5, #0C447C)', color: '#fff', display: 'grid', placeItems: 'center', fontSize: 11, fontWeight: 700 }}>KT</div>
    </div>
  </header>
);

window.PageMyCourses = PageMyCourses;
window.UserDropdown = UserDropdown;
window.MobileDrawer = MobileDrawer;
window.MobileTopBar = MobileTopBar;
