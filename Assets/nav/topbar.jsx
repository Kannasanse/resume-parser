// Top context bar — breadcrumb left / contextual center / utilities right

const TopBarStyles = () => (
  <style>{`
    .tb {
      height: 52px;
      background: #fff;
      border-bottom: 1px solid #D1DCE8;
      display: flex; align-items: center;
      padding: 0 24px;
      font-family: 'Inter', system-ui, sans-serif;
      color: #2C2C2A;
      gap: 16px;
    }
    .tb-scrolled { box-shadow: 0 2px 8px rgba(12,68,124,0.05); }

    /* LEFT */
    .tb-left { display: flex; align-items: center; gap: 8px; min-width: 0; }
    .tb-page-title { font-size: 16px; font-weight: 700; color: #2C2C2A; letter-spacing: -0.01em; }
    .tb-crumb { display: flex; align-items: center; gap: 6px; font-size: 13px; min-width: 0; }
    .tb-crumb-link { color: #9CA3AF; cursor: pointer; transition: color 150ms; white-space: nowrap; }
    .tb-crumb-link:hover { color: #185FA5; }
    .tb-crumb-sep { color: #D1DCE8; flex-shrink: 0; }
    .tb-crumb-current { color: #2C2C2A; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

    /* CENTER */
    .tb-center { flex: 1; display: flex; align-items: center; justify-content: center; gap: 12px; min-width: 0; }

    /* RIGHT */
    .tb-right { display: flex; align-items: center; gap: 4px; }
    .tb-icon-btn {
      width: 36px; height: 36px; border-radius: 8px;
      display: grid; place-items: center;
      color: #6B7280; cursor: pointer;
      transition: background 150ms, color 150ms;
      background: none; border: none; padding: 0;
    }
    .tb-icon-btn:hover { background: rgba(24,95,165,0.06); color: #185FA5; }

    .tb-credits {
      display: inline-flex; align-items: center; gap: 4px;
      background: linear-gradient(135deg, #FEF3C7, #FDE68A);
      color: #B45309;
      border: 1px solid rgba(245,158,11,0.25);
      border-radius: 9999px;
      font-size: 13px; font-weight: 700;
      padding: 4px 10px 4px 8px;
      cursor: pointer;
      transition: box-shadow 150ms;
    }
    .tb-credits:hover { box-shadow: 0 2px 8px rgba(245,158,11,0.25); }

    .tb-avatar {
      width: 28px; height: 28px; border-radius: 9999px;
      background: linear-gradient(135deg, #185FA5, #0C447C);
      color: #fff; font-size: 12px; font-weight: 700;
      display: grid; place-items: center; cursor: pointer;
      transition: box-shadow 150ms;
      margin-left: 8px;
    }
    .tb-avatar:hover { box-shadow: 0 0 0 2px #185FA5; }

    /* Context-specific chips */
    .tb-chip {
      display: inline-flex; align-items: center; gap: 6px;
      background: #F4F8FC; border: 1px solid #D1DCE8;
      border-radius: 8px; padding: 4px 10px;
      font-size: 13px; font-weight: 500;
      color: #2C2C2A;
    }
    .tb-chip-mono { font-family: 'JetBrains Mono', monospace; font-size: 12px; color: #6B7280; }
    .tb-status {
      display: inline-flex; align-items: center; gap: 6px;
      font-size: 12px; color: #1D9E75; font-weight: 500;
    }
    .tb-status-dot { width: 6px; height: 6px; border-radius: 50%; background: #1D9E75; }
    .tb-progress-pill {
      display: inline-flex; align-items: center; gap: 8px;
      background: #E6F1FB; color: #185FA5;
      border-radius: 9999px; padding: 4px 12px;
      font-size: 12px; font-weight: 600;
    }
    .tb-step {
      display: inline-flex; align-items: center; gap: 8px;
      font-size: 13px; color: #2C2C2A; font-weight: 500;
    }
    .tb-step-dots { display: flex; gap: 4px; }
    .tb-step-dot { width: 6px; height: 6px; border-radius: 50%; background: #D1DCE8; }
    .tb-step-dot.done { background: #185FA5; }
    .tb-step-dot.current { background: #185FA5; box-shadow: 0 0 0 3px rgba(24,95,165,0.18); }
    .tb-tabs {
      display: flex; gap: 2px;
      background: #F4F8FC; border: 1px solid #D1DCE8;
      border-radius: 10px; padding: 3px;
    }
    .tb-tab {
      padding: 4px 12px; border-radius: 7px;
      font-size: 12px; font-weight: 500; color: #6B7280;
      cursor: pointer; transition: all 150ms;
    }
    .tb-tab:hover { color: #2C2C2A; }
    .tb-tab.active { background: #fff; color: #185FA5; font-weight: 600; box-shadow: 0 1px 2px rgba(12,68,124,0.06); }
    .tb-edit-title {
      font-size: 14px; font-weight: 600; color: #2C2C2A;
      border: 1px dashed transparent; border-radius: 6px;
      padding: 4px 8px; cursor: text;
      transition: border-color 150ms, background 150ms;
    }
    .tb-edit-title:hover { border-color: #D1DCE8; }
    .tb-view-toggle { display: flex; gap: 0; border: 1px solid #D1DCE8; border-radius: 8px; overflow: hidden; }
    .tb-view-btn {
      width: 30px; height: 30px; display: grid; place-items: center;
      color: #6B7280; cursor: pointer; background: #fff;
      transition: background 150ms;
    }
    .tb-view-btn.active { background: #E6F1FB; color: #185FA5; }
    .tb-view-btn:hover:not(.active) { background: #F4F8FC; }
  `}</style>
);

// Context renderers — varies per page
const TBContext = {
  builder: () => (
    <>
      <div className="tb-chip">
        <NavIcon name="fileText" size={14} color="#185FA5" />
        Modern Two-Column
      </div>
      <div className="tb-status">
        <div className="tb-status-dot" />
        Saved 2s ago
      </div>
    </>
  ),
  'career-map': () => (
    <div className="tb-step">
      <span>Step 2 of 4</span>
      <div className="tb-step-dots">
        <div className="tb-step-dot done" />
        <div className="tb-step-dot current" />
        <div className="tb-step-dot" />
        <div className="tb-step-dot" />
      </div>
      <span style={{ color: '#6B7280' }}>· Questionnaire</span>
    </div>
  ),
  'study-plan': () => (
    <>
      <div className="tb-chip">Docker Basics</div>
      <div className="tb-progress-pill">
        <NavIcon name="check" size={12} />
        62% complete
      </div>
    </>
  ),
  'my-courses': () => (
    <div className="tb-tabs">
      <div className="tb-tab active">All courses</div>
      <div className="tb-tab">In progress</div>
      <div className="tb-tab">Completed</div>
      <div className="tb-tab">Archived</div>
    </div>
  ),
  notes: () => (
    <>
      <div className="tb-edit-title">System Design — Caching Strategies</div>
      <div className="tb-status">
        <div className="tb-status-dot" />
        Saved
      </div>
      <div className="tb-view-toggle">
        <div className="tb-view-btn active"><NavIcon name="menu" size={14} /></div>
        <div className="tb-view-btn"><NavIcon name="fileText" size={14} /></div>
      </div>
    </>
  ),
  default: () => null,
};

const Breadcrumb = ({ trail }) => (
  <div className="tb-crumb">
    {trail.map((node, i) => {
      const isLast = i === trail.length - 1;
      return (
        <React.Fragment key={i}>
          {isLast
            ? <span className="tb-crumb-current">{node}</span>
            : <span className="tb-crumb-link">{node}</span>}
          {!isLast && <NavIcon name="chevronRight" size={12} className="tb-crumb-sep" />}
        </React.Fragment>
      );
    })}
  </div>
);

const TopBar = ({
  title,
  trail,
  contextKey = 'default',
  credits = 38,
  scrolled = false,
  showMenu = false,
  onMenu,
}) => {
  const Context = TBContext[contextKey] || TBContext.default;
  return (
    <header className={'tb' + (scrolled ? ' tb-scrolled' : '')}>
      <TopBarStyles />
      <div className="tb-left">
        {showMenu && (
          <button className="tb-icon-btn" onClick={onMenu} style={{ marginRight: 4, marginLeft: -8 }}>
            <NavIcon name="menu" size={20} />
          </button>
        )}
        {trail ? <Breadcrumb trail={trail} /> : <div className="tb-page-title">{title}</div>}
      </div>
      <div className="tb-center">
        <Context />
      </div>
      <div className="tb-right">
        <button className="tb-icon-btn" title="Search · ⌘K"><NavIcon name="search" size={18} /></button>
        <button className="tb-icon-btn" title="Switch to dark mode"><NavIcon name="moon" size={18} /></button>
        <div className="tb-credits" title="AI Credits remaining">
          <NavIcon name="sparkles" size={12} color="#B45309" strokeWidth={2.25} />
          +{credits}
        </div>
        <div className="tb-avatar">KT</div>
      </div>
    </header>
  );
};

window.TopBar = TopBar;
window.TBContext = TBContext;
