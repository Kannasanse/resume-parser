'use client';

export function SQLResultTable({ result }) {
  if (result.message) {
    return (
      <div style={{ color: '#1D9E75', fontSize: 13, padding: '8px 0' }}>
        ✓ {result.message}
      </div>
    );
  }

  return (
    <div style={{ overflowX: 'auto', marginBottom: 16 }}>
      <table style={{
        borderCollapse: 'collapse', fontSize: 12,
        width: '100%', fontFamily: 'monospace',
      }}>
        <thead>
          <tr>
            {result.columns.map(col => (
              <th key={col} style={{
                padding: '6px 12px', textAlign: 'left',
                borderBottom: '2px solid rgba(255,255,255,0.15)',
                color: '#5B9FD4', fontWeight: 700,
                background: 'rgba(24,95,165,0.10)',
                whiteSpace: 'nowrap',
              }}>
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {result.values.map((row, ri) => (
            <tr key={ri} style={{
              background: ri % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)',
            }}>
              {row.map((cell, ci) => (
                <td key={ci} style={{
                  padding: '5px 12px',
                  borderBottom: '1px solid rgba(255,255,255,0.06)',
                  color: '#E8EFF7',
                  whiteSpace: 'nowrap',
                }}>
                  {cell === null
                    ? <span style={{ color: '#6B7280' }}>NULL</span>
                    : String(cell)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{ fontSize: 10, color: '#6B7280', marginTop: 6, textAlign: 'right' }}>
        {result.values.length} row{result.values.length !== 1 ? 's' : ''}
      </div>
    </div>
  );
}
