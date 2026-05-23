// Sidebar component — supports expanded / collapsed states + inline "More" section.
// All visual tokens come from the brief; this file owns the sidebar chrome only.

const NAV_GROUPS = [
  {
    id: 'workspace', label: 'WORKSPACE', items: [
      { id: 'builder',    icon: 'fileText',  label: 'Resume Builder', route: '/builder' },
      { id: 'portfolios', icon: 'briefcase', label: 'Portfolios',     route: '/portfolios' },
      { id: 'career-map', icon: 'map',       label: 'Career Map',     route: '/career-map' },
    ],
  },
  {
    id: 'learning', label: 'LEARNING', items: [
      { id: 'my-courses', icon: 'bookOpen', label: 'My Courses',     route: '/my-courses' },
      { id: 'self-test',  icon: 'target',   label: 'Interview Prep', route: '/self-test' },
      { id: 'notes',      icon: 'notebook', label: 'Notes',          route: '/notes' },
    ],
  },
];

const MORE_ITEMS = [
  { id: 'settings', icon: 'settings',  label: 'Settings',         route: '/settings' },
  { id: 'billing',  icon: 'receipt',   label: 'Billing & Credits', route: '/settings/billing' },
  { id: 'help',     icon: 'help',      label: 'Help & Support',    external: true },
  { id: 'whats-new',icon: 'megaphone', label: "What's New",        route: '/changelog' },
];

// CSS variables for sidebar tokens — keep in one place
const SidebarStyles = () => (
  <style>{`
    .sb {
      --sb-bg: #FFFFFF;
      --sb-border: #D1DCE8;
      --sb-text: #2C2C2A;
      --sb-muted: #6B7280;
      --sb-section: #9CA3AF;
      --sb-active-bg: #E6F1FB;
      --sb-active-text: #185FA5;
      --sb-hover-bg: rgba(24,95,165,0.06);
      --sb-divider: #D1DCE8;
      position: relative;
      background: var(--sb-bg);
      border-right: 1px solid var(--sb-border);
      display: flex; flex-direction: column;
      font-family: 'Inter', system-ui, sans-serif;
      color: var(--sb-text);
      height: 100%;
      overflow: hidden;
      transition: width 220ms cubic-bezier(0.16, 1, 0.3, 1);
    }
    .sb.expanded { width: 240px; }
    .sb.collapsed { width: 64px; }
    .sb-header { padding: 20px 16px 16px; display: flex; align-items: center; gap: 10px; }
    .sb.collapsed .sb-header { padding: 20px 0 16px; justify-content: center; }
    .sb-logo-mark {
      width: 36px; height: 36px; border-radius: 10px;
      background: linear-gradient(135deg, #185FA5, #0C447C);
      color: #fff; display: grid; place-items: center;
      box-shadow: 0 4px 12px rgba(24,95,165,0.25);
      flex-shrink: 0;
    }
    .sb-logo-text {
      font-size: 18px; font-weight: 800; letter-spacing: -0.02em;
      color: var(--sb-text);
    }
    .sb-section {
      font-size: 10px; font-weight: 700; text-transform: uppercase;
      letter-spacing: 0.08em; color: var(--sb-section);
      padding: 0 20px; margin: 16px 0 4px;
    }
    .sb-items { padding: 0 8px; }
    .sb-item {
      position: relative;
      display: flex; align-items: center; gap: 10px;
      height: 40px; padding: 0 12px; margin: 2px 0;
      border-radius: 10px;
      color: var(--sb-text);
      font-size: 14px; font-weight: 500;
      cursor: pointer; text-decoration: none;
      transition: background 150ms ease, color 150ms ease;
      white-space: nowrap;
    }
    .sb-item:hover { background: var(--sb-hover-bg); color: var(--sb-active-text); }
    .sb-item:hover .sb-item-icon { color: var(--sb-active-text); }
    .sb-item-icon { color: var(--sb-muted); flex-shrink: 0; transition: color 150ms; }
    .sb-item-label { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; }
    .sb-item.active {
      background: var(--sb-active-bg);
      color: var(--sb-active-text);
      font-weight: 600;
      box-shadow: inset 3px 0 0 0 #185FA5;
    }
    .sb-item.active .sb-item-icon { color: var(--sb-active-text); }
    .sb.collapsed .sb-items { padding: 0; }
    .sb.collapsed .sb-item {
      height: 44px; width: 44px; margin: 2px auto;
      border-radius: 12px; padding: 0; justify-content: center;
    }
    .sb.collapsed .sb-item.active { box-shadow: inset 3px 0 0 0 #185FA5; }
    .sb.collapsed .sb-section { display: none; }
    .sb.collapsed .sb-section-spacer { height: 8px; }
    .sb-divider {
      height: 1px; background: var(--sb-divider);
      margin: 8px 16px;
    }
    .sb.collapsed .sb-divider { margin: 8px 12px; }
    .sb-more-children { padding: 0 8px 0 16px; }
    .sb-more-children .sb-item {
      height: 36px; font-size: 13px; padding-left: 18px;
    }
    .sb-more-children .sb-item-icon { width: 16px; height: 16px; }
    .sb-chevron { transition: transform 200ms ease; color: var(--sb-muted); flex-shrink: 0; }
    .sb-chevron.open { transform: rotate(90deg); }
    .sb-footer {
      margin-top: auto;
      padding: 8px;
      border-top: 1px solid var(--sb-divider);
    }
    .sb-footer-row { padding: 0 4px; }
    .sb-collapse-btn {
      display: flex; align-items: center; gap: 10px;
      height: 32px; padding: 0 12px; margin: 4px 0;
      border-radius: 8px;
      color: var(--sb-section);
      font-size: 12px; font-weight: 500;
      cursor: pointer; width: 100%;
      transition: background 150ms;
    }
    .sb-collapse-btn:hover { background: var(--sb-hover-bg); color: var(--sb-active-text); }
    .sb-collapse-btn .sb-item-icon { color: var(--sb-section); }
    .sb-collapse-btn:hover .sb-item-icon { color: var(--sb-active-text); }
    .sb.collapsed .sb-collapse-btn {
      width: 44px; height: 44px; margin: 4px auto; padding: 0;
      justify-content: center; border-radius: 12px;
    }
    .sb-user {
      display: flex; align-items: center; gap: 10px;
      padding: 8px 8px;
      border-radius: 10px;
      cursor: pointer;
      transition: background 150ms;
      margin-top: 4px;
    }
    .sb-user:hover { background: var(--sb-hover-bg); }
    .sb.collapsed .sb-user { padding: 4px; justify-content: center; }
    .sb-avatar {
      width: 28px; height: 28px; border-radius: 50%;
      background: linear-gradient(135deg, #185FA5, #0C447C);
      color: #fff; display: grid; place-items: center;
      font-size: 11px; font-weight: 700;
      flex-shrink: 0;
    }
    .sb-user-meta { flex: 1; min-width: 0; line-height: 1.25; }
    .sb-user-name { font-size: 13px; font-weight: 500; color: var(--sb-text); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .sb-user-email { font-size: 11px; color: var(--sb-muted); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .sb-tooltip {
      position: absolute; left: calc(100% + 8px); top: 50%;
      transform: translateY(-50%);
      background: #0C447C; color: #fff;
      font-size: 12px; font-weight: 500;
      padding: 6px 10px; border-radius: 6px;
      white-space: nowrap; pointer-events: none;
      box-shadow: 0 4px 12px rgba(12,68,124,0.2);
      z-index: 100;
    }
    .sb-tooltip::before {
      content: ''; position: absolute; right: 100%; top: 50%;
      transform: translateY(-50%);
      border: 4px solid transparent; border-right-color: #0C447C;
    }
  `}</style>
);

const SidebarItem = ({ item, active, collapsed, onClick, showTooltip }) => (
  <div
    className={'sb-item' + (active ? ' active' : '')}
    onClick={onClick}
    title={collapsed && !showTooltip ? item.label : undefined}
  >
    <NavIcon name={item.icon} size={collapsed ? 20 : 18} className="sb-item-icon" />
    {!collapsed && <span className="sb-item-label">{item.label}</span>}
    {collapsed && showTooltip && <span className="sb-tooltip">{item.label}</span>}
  </div>
);

const Sidebar = ({
  collapsed = false,
  activeId = 'my-courses',
  moreOpen = false,
  tooltipFor = null,
  onToggle,
  onItemClick,
  onMoreToggle,
}) => {
  return (
    <aside className={'sb ' + (collapsed ? 'collapsed' : 'expanded')}>
      <SidebarStyles />
      <div className="sb-header">
        <div className="sb-logo-mark">
          <NavIcon name="shield" size={20} color="#fff" strokeWidth={2.25} />
        </div>
        {!collapsed && <div className="sb-logo-text">Proflect</div>}
      </div>

      <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
        {NAV_GROUPS.map((group, gi) => (
          <React.Fragment key={group.id}>
            {gi > 0 && <div className="sb-divider" />}
            {!collapsed && <div className="sb-section">{group.label}</div>}
            {collapsed && gi > 0 && null}
            <div className="sb-items">
              {group.items.map(item => (
                <SidebarItem
                  key={item.id}
                  item={item}
                  active={activeId === item.id}
                  collapsed={collapsed}
                  showTooltip={tooltipFor === item.id}
                  onClick={() => onItemClick && onItemClick(item.id)}
                />
              ))}
            </div>
          </React.Fragment>
        ))}

        {/* More section */}
        <div className="sb-divider" />
        <div className="sb-items">
          <div
            className="sb-item"
            onClick={onMoreToggle}
            style={{ cursor: 'pointer' }}
          >
            <NavIcon name="moreH" size={collapsed ? 20 : 18} className="sb-item-icon" />
            {!collapsed && <>
              <span className="sb-item-label">More</span>
              <NavIcon name="chevronRight" size={14} className={'sb-chevron' + (moreOpen ? ' open' : '')} />
            </>}
            {collapsed && tooltipFor === 'more' && <span className="sb-tooltip">More</span>}
          </div>
          {moreOpen && !collapsed && (
            <div className="sb-more-children">
              {MORE_ITEMS.map(item => (
                <div key={item.id} className="sb-item">
                  <NavIcon name={item.icon} size={16} className="sb-item-icon" />
                  <span className="sb-item-label">{item.label}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="sb-footer">
        <div className="sb-footer-row">
          <div
            className="sb-item"
            style={{ cursor: 'pointer' }}
            title={collapsed && tooltipFor !== 'search' ? 'Search' : undefined}
          >
            <NavIcon name="search" size={collapsed ? 20 : 18} className="sb-item-icon" />
            {!collapsed && <>
              <span className="sb-item-label">Search</span>
              <span style={{ fontSize: 10, fontFamily: 'JetBrains Mono, monospace', color: '#9CA3AF', background: '#F4F8FC', padding: '2px 6px', borderRadius: 4, border: '1px solid #D1DCE8' }}>⌘K</span>
            </>}
            {collapsed && tooltipFor === 'search' && <span className="sb-tooltip">Search · ⌘K</span>}
          </div>
        </div>
        <div
          className="sb-collapse-btn"
          onClick={onToggle}
        >
          <NavIcon name={collapsed ? 'panelLeftOpen' : 'panelLeftClose'} size={16} className="sb-item-icon" />
          {!collapsed && <span>Collapse</span>}
        </div>
        <div className="sb-user">
          <div className="sb-avatar">KT</div>
          {!collapsed && (
            <>
              <div className="sb-user-meta">
                <div className="sb-user-name">Karthik Tadepalli</div>
                <div className="sb-user-email">karthik@revature.com</div>
              </div>
              <NavIcon name="chevronDown" size={14} color="#6B7280" />
            </>
          )}
        </div>
      </div>
    </aside>
  );
};

window.Sidebar = Sidebar;
window.NAV_GROUPS = NAV_GROUPS;
window.MORE_ITEMS = MORE_ITEMS;
