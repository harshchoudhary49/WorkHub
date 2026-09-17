const STATUS_STYLE = {
  present: { color: '#16a34a', label: 'Present' },
  remote: { color: '#0284c7', label: 'Remote' },
  leave: { color: '#eab308', label: 'On leave' },
  absent: { color: '#ef4444', label: 'Absent' },
  'half-day': { color: '#f59e0b', label: 'Half day' },
  'not-checked-in': { color: '#cbd5e1', label: 'Not checked in' },
  holiday: { color: '#94a3b8', label: 'Holiday' },
  weekend: { color: '#94a3b8', label: 'Weekend' },
};

export const DESK_LEGEND = [
  { status: 'present', emoji: '🟢' },
  { status: 'remote', emoji: '🔵' },
  { status: 'leave', emoji: '🟡' },
  { status: 'absent', emoji: '🔴' },
  { status: 'not-checked-in', emoji: '⚪' },
];

export default function DeskMarker({ desk, cellSize, onClick }) {
  const empty = !desk.employee;
  const style = desk.employee ? STATUS_STYLE[desk.employee.status] || STATUS_STYLE['not-checked-in'] : null;
  const dimmed = desk.employee && desk.matchesFilter === false;

  const initials = desk.employee
    ? desk.employee.name
        .split(' ')
        .map((p) => p[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : '';

  return (
    <button
      onClick={() => desk.employee && onClick(desk)}
      title={desk.employee ? `${desk.employee.name} — ${STATUS_STYLE[desk.employee.status]?.label}` : `Desk ${desk.deskCode} (empty)`}
      className="absolute flex items-center justify-center rounded-lg border text-[10px] font-semibold transition-opacity"
      style={{
        left: desk.position.x * cellSize,
        top: desk.position.y * cellSize,
        width: cellSize - 6,
        height: cellSize - 6,
        backgroundColor: empty ? '#f8fafc' : `${style.color}22`,
        borderColor: empty ? '#e2e8f0' : style.color,
        color: empty ? '#94a3b8' : style.color,
        opacity: dimmed ? 0.3 : 1,
        cursor: desk.employee ? 'pointer' : 'default',
      }}
    >
      {empty ? desk.deskCode : initials}
    </button>
  );
}
