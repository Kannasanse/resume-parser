// App entry — composes navigation pieces into a DesignCanvas with one
// artboard per view called out in the brief.

const { useState } = React;

// Full app shell for the big "real context" frames
const AppShell = ({ collapsed, activeId, moreOpen, topbarProps, scrolled }) => {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: (collapsed ? 64 : 240) + 'px 1fr',
      height: '100%',
      background: '#F4F8FC',
      transition: 'grid-template-columns 220ms cubic-bezier(0.16, 1, 0.3, 1)',
    }}>
      <Sidebar
        collapsed={collapsed}
        activeId={activeId}
        moreOpen={moreOpen}
      />
      <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>
        <TopBar scrolled={scrolled} {...topbarProps} />
        <div style={{ flex: 1, overflow: 'auto' }}>
          <PageMyCourses />
        </div>
      </div>
    </div>
  );
};

// One "context bar" row, framed against a faint dashed sidebar stub so the
// 240px / 64px offset is visually accurate.
const TopBarStudy = ({ label, children, hint }) => (
  <div style={{ background: '#F4F8FC', padding: '20px 24px', fontFamily: 'Inter, system-ui, sans-serif' }}>
    <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9CA3AF', marginBottom: 8 }}>{label}</div>
    <div style={{ display: 'grid', gridTemplateColumns: '64px 1fr', border: '1px solid #D1DCE8', borderRadius: 12, overflow: 'hidden', background: '#fff', boxShadow: '0 1px 2px rgba(12,68,124,0.04)' }}>
      {/* sidebar stub */}
      <div style={{ background: '#fff', borderRight: '1px solid #D1DCE8', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '14px 0', gap: 12 }}>
        <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg, #185FA5, #0C447C)', display: 'grid', placeItems: 'center' }}>
          <NavIcon name="shield" size={16} color="#fff" />
        </div>
        <div style={{ width: 24, height: 2, background: '#D1DCE8', borderRadius: 2 }} />
      </div>
      {children}
    </div>
    {hint && <div style={{ fontSize: 12, color: '#6B7280', marginTop: 8 }}>{hint}</div>}
  </div>
);

const App = () => {
  return (
    <DesignCanvas
      bgColor="#eeeae3"
      title="Proflect · Navigation Redesign"
      subtitle="Hybrid left sidebar + top context bar. All states, popovers, and breakpoints."
    >

      {/* ─────────── Section 1 · Application Shell ─────────── */}
      <DCSection id="shell" title="01 · Application shell" subtitle="The full picture — sidebar + top bar + page content. Two states.">

        <DCArtboard id="shell-expanded" label="A · Expanded sidebar (default)" width={1280} height={780}>
          <AppShell
            collapsed={false}
            activeId="my-courses"
            moreOpen={false}
            topbarProps={{
              title: 'My Courses',
              contextKey: 'my-courses',
              credits: 38,
            }}
          />
        </DCArtboard>

        <DCArtboard id="shell-collapsed" label="B · Collapsed sidebar (64px)" width={1280} height={780}>
          <AppShell
            collapsed={true}
            activeId="my-courses"
            moreOpen={false}
            topbarProps={{
              title: 'My Courses',
              contextKey: 'my-courses',
              credits: 38,
            }}
          />
        </DCArtboard>

        <DCArtboard id="shell-scrolled-breadcrumb" label="C · Nested page · scrolled · breadcrumb" width={1280} height={780}>
          <AppShell
            collapsed={false}
            activeId="my-courses"
            scrolled={true}
            topbarProps={{
              trail: ['My Courses', 'Python & Docker', 'Docker Basics'],
              contextKey: 'study-plan',
              credits: 38,
            }}
          />
        </DCArtboard>
      </DCSection>

      {/* ─────────── Section 2 · Sidebar details ─────────── */}
      <DCSection id="sidebar" title="02 · Sidebar — all states" subtitle="Default, hover, active, More-expanded, and the collapsed/tooltip pair.">

        <DCArtboard id="sb-expanded" label="A · Expanded · default" width={240} height={780}>
          <Sidebar collapsed={false} activeId="my-courses" />
        </DCArtboard>

        <DCArtboard id="sb-more" label="B · Expanded · More open" width={240} height={780}>
          <Sidebar collapsed={false} activeId="my-courses" moreOpen={true} />
        </DCArtboard>

        <DCArtboard id="sb-collapsed" label="C · Collapsed · 64px" width={64} height={780}>
          <Sidebar collapsed={true} activeId="my-courses" />
        </DCArtboard>

        <DCArtboard id="sb-tooltip" label="D · Collapsed · tooltip on hover" width={240} height={780}>
          <div style={{ position: 'relative', height: '100%', width: 64 }}>
            <Sidebar collapsed={true} activeId="my-courses" tooltipFor="self-test" />
          </div>
        </DCArtboard>

      </DCSection>

      {/* ─────────── Section 3 · Top context bar ─────────── */}
      <DCSection id="topbar" title="03 · Top context bar" subtitle="The center slot adapts to the active page; left and right stay consistent.">

        <DCArtboard id="tb-builder" label="A · Resume Builder" width={1280} height={130}>
          <TopBarStudy label="Template chip + save status">
            <TopBar title="Resume Builder" contextKey="builder" credits={38} />
          </TopBarStudy>
        </DCArtboard>

        <DCArtboard id="tb-career" label="B · Career Map" width={1280} height={130}>
          <TopBarStudy label="Step indicator">
            <TopBar title="Career Map" contextKey="career-map" credits={38} />
          </TopBarStudy>
        </DCArtboard>

        <DCArtboard id="tb-my-courses" label="C · My Courses" width={1280} height={130}>
          <TopBarStudy label="Filter tabs in context bar (saves vertical space)">
            <TopBar title="My Courses" contextKey="my-courses" credits={38} />
          </TopBarStudy>
        </DCArtboard>

        <DCArtboard id="tb-study" label="D · Study plan topic (breadcrumb)" width={1280} height={130}>
          <TopBarStudy label="Breadcrumb + topic + progress pill">
            <TopBar trail={['My Courses', 'Python & Docker', 'Docker Basics']} contextKey="study-plan" credits={38} />
          </TopBarStudy>
        </DCArtboard>

        <DCArtboard id="tb-notes" label="E · Notes (inline title + view toggle)" width={1280} height={130}>
          <TopBarStudy label="Inline-editable title + view toggle">
            <TopBar title="Notes" contextKey="notes" credits={38} />
          </TopBarStudy>
        </DCArtboard>

        <DCArtboard id="tb-default" label="F · Top-level page (no context)" width={1280} height={130}>
          <TopBarStudy label="Quiet state — page title only">
            <TopBar title="Portfolios" contextKey="default" credits={38} />
          </TopBarStudy>
        </DCArtboard>

      </DCSection>

      {/* ─────────── Section 4 · States & popovers ─────────── */}
      <DCSection id="states" title="04 · States & popovers" subtitle="Nav item states close-up, user dropdown, and where it anchors from.">

        <DCArtboard id="states-nav-item" label="A · Nav item states" width={300} height={300}>
          <div style={{ background: '#fff', padding: 16, height: '100%', fontFamily: 'Inter, system-ui, sans-serif', display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', color: '#9CA3AF', textTransform: 'uppercase', marginBottom: 6 }}>Default</div>
              <div className="sb-item" style={{ background: 'transparent' }}>
                <NavIcon name="briefcase" size={18} className="sb-item-icon" />
                <span className="sb-item-label">Portfolios</span>
              </div>
            </div>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', color: '#9CA3AF', textTransform: 'uppercase', marginBottom: 6 }}>Hover</div>
              <div className="sb-item" style={{ background: 'rgba(24,95,165,0.06)', color: '#185FA5' }}>
                <NavIcon name="briefcase" size={18} color="#185FA5" />
                <span className="sb-item-label">Portfolios</span>
              </div>
            </div>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', color: '#9CA3AF', textTransform: 'uppercase', marginBottom: 6 }}>Active</div>
              <div className="sb-item active">
                <NavIcon name="briefcase" size={18} color="#185FA5" />
                <span className="sb-item-label">Portfolios</span>
              </div>
            </div>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', color: '#9CA3AF', textTransform: 'uppercase', marginBottom: 6 }}>Active · gradient variant</div>
              <div className="sb-item" style={{ background: 'linear-gradient(90deg, rgba(24,95,165,0.14), rgba(24,95,165,0.02))', color: '#185FA5', fontWeight: 600, boxShadow: 'inset 3px 0 0 0 #185FA5' }}>
                <NavIcon name="briefcase" size={18} color="#185FA5" />
                <span className="sb-item-label">Portfolios</span>
              </div>
            </div>
            <SidebarStyles />
          </div>
        </DCArtboard>

        <DCArtboard id="states-dropdown" label="B · User dropdown · anchored from sidebar footer" width={520} height={420}>
          <div style={{ position: 'relative', height: '100%', background: '#F4F8FC', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 240 }}>
              <Sidebar collapsed={false} activeId="my-courses" />
            </div>
            <div style={{ position: 'absolute', left: 252, bottom: 64, zIndex: 10 }}>
              <UserDropdown />
            </div>
            {/* arrow */}
            <svg style={{ position: 'absolute', left: 232, bottom: 76, zIndex: 11 }} width="20" height="14" viewBox="0 0 20 14" fill="none">
              <path d="M0 7 L20 0 L20 14 Z" fill="#fff" stroke="#D1DCE8" strokeWidth="1"/>
            </svg>
          </div>
        </DCArtboard>

        <DCArtboard id="states-dropdown-topbar" label="C · User dropdown · from top-bar avatar" width={520} height={420}>
          <div style={{ position: 'relative', height: '100%', background: '#F4F8FC', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', left: 0, top: 0, right: 0, height: 52 }}>
              <TopBar title="Portfolios" contextKey="default" credits={38} />
            </div>
            <div style={{ position: 'absolute', right: 16, top: 64, zIndex: 10 }}>
              <UserDropdown />
            </div>
          </div>
        </DCArtboard>

      </DCSection>

      {/* ─────────── Section 5 · Responsive ─────────── */}
      <DCSection id="responsive" title="05 · Responsive" subtitle="Below 768px the sidebar becomes a drawer; the top bar takes a hamburger.">

        <DCArtboard id="mobile-closed" label="A · Mobile · drawer closed" width={390} height={780}>
          <div style={{ background: '#F4F8FC', height: '100%', display: 'flex', flexDirection: 'column' }}>
            <MobileTopBar />
            <div style={{ flex: 1, padding: '20px 16px', fontFamily: 'Inter, system-ui, sans-serif' }}>
              <h1 style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.02em', margin: '0 0 4px', color: '#2C2C2A' }}>My Courses</h1>
              <p style={{ fontSize: 13, color: '#6B7280', margin: 0 }}>6 active plans</p>
              <div style={{ display: 'grid', gap: 12, marginTop: 16 }}>
                {[
                  { title: 'Python & Docker for Backend Engineers', pct: 62 },
                  { title: 'System Design Interview Prep', pct: 35 },
                  { title: 'React Advanced Patterns', pct: 100 },
                ].map((c, i) => (
                  <div key={i} style={{ background: '#fff', border: '1px solid #D1DCE8', borderRadius: 12, padding: 14 }}>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 10 }}>
                      <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg, #185FA5, #0C447C)', display: 'grid', placeItems: 'center' }}>
                        <NavIcon name="bookOpen" size={16} color="#fff" />
                      </div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: '#2C2C2A', lineHeight: 1.3 }}>{c.title}</div>
                    </div>
                    <div style={{ height: 6, background: '#F4F8FC', borderRadius: 99, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: c.pct + '%', background: 'linear-gradient(90deg, #185FA5, #1D9E75)' }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </DCArtboard>

        <DCArtboard id="mobile-drawer" label="B · Mobile · drawer open" width={390} height={780}>
          <MobileDrawer activeId="my-courses" />
        </DCArtboard>

        <DCArtboard id="tablet" label="C · Tablet · sidebar auto-collapsed" width={820} height={780}>
          <AppShell
            collapsed={true}
            activeId="my-courses"
            topbarProps={{ title: 'My Courses', contextKey: 'my-courses', credits: 38, showMenu: false }}
          />
        </DCArtboard>

      </DCSection>

    </DesignCanvas>
  );
};

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
