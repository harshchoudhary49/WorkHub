// Minimal stroke icons, no icon-library dependency. Just enough shapes to
// cover the nav across all four roles. `NavIcon` picks one by keyword so
// each page in NAV_BY_ROLE doesn't need to be individually wired up.

const base = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.75,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  viewBox: '0 0 24 24',
  width: 18,
  height: 18,
};

const paths = {
  gauge: <path d="M12 14 15 10M4 14a8 8 0 1 1 16 0M4 14h1M19 14h1M12 5v1" />,
  clock: <path d="M12 8v4l2.5 2.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />,
  calendarOff: (
    <path d="M4 6h16M8 3v3M16 3v3M4 6v13a1 1 0 0 0 1 1h9M20 6v5M9.5 13.5l7 7M9.5 20.5l7-7" />
  ),
  clipboard: (
    <path d="M9 4h6a1 1 0 0 1 1 1v1H8V5a1 1 0 0 1 1-1ZM6 6h12v14a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V6ZM9 12l2 2 4-4" />
  ),
  target: <path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM12 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" />,
  trendUp: <path d="M4 17 10 11 14 15 20 7M20 7h-5M20 7v5" />,
  megaphone: <path d="M3 10v4a1 1 0 0 0 1 1h2l5 4V5L6 9H4a1 1 0 0 0-1 1ZM16 8a4 4 0 0 1 0 8M19 5a8 8 0 0 1 0 14" />,
  award: <path d="M12 15a5 5 0 1 0 0-10 5 5 0 0 0 0 10ZM8.5 13.5 7 21l5-2 5 2-1.5-7.5" />,
  message: <path d="M21 15a2 2 0 0 1-2 2H8l-5 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10Z" />,
  user: <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM4 21a8 8 0 0 1 16 0" />,
  map: <path d="M9 4 4 6v14l5-2 6 2 5-2V4l-5 2-6-2ZM9 4v14M15 6v14" />,
  chart: <path d="M4 20V10M11 20V4M18 20v-7M4 20h16" />,
  users: <path d="M9 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM3 20a6 6 0 0 1 12 0M17 8a3 3 0 1 1 4 2.83M17 14a5 5 0 0 1 4 4.9" />,
  building: <path d="M4 21V5a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v16M12 21v-8a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v8M4 21h16M7 7h1M7 11h1M7 15h1" />,
  settings: <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" />,
};

const KEYWORD_ICON = [
  [/dashboard/i, 'gauge'],
  [/attendance/i, 'clock'],
  [/leave/i, 'calendarOff'],
  [/holiday/i, 'calendarOff'],
  [/task/i, 'clipboard'],
  [/goal/i, 'target'],
  [/performance/i, 'trendUp'],
  [/announcement/i, 'megaphone'],
  [/recognition/i, 'award'],
  [/message/i, 'message'],
  [/profile/i, 'user'],
  [/workforce|map/i, 'map'],
  [/report/i, 'chart'],
  [/employee|team/i, 'users'],
  [/department|office/i, 'building'],
  [/setup/i, 'settings'],
];

function iconKeyFor(label) {
  const match = KEYWORD_ICON.find(([re]) => re.test(label));
  return match ? match[1] : 'gauge';
}

export function NavIcon({ label, className = '' }) {
  const key = iconKeyFor(label);
  return (
    <svg {...base} className={className} aria-hidden="true">
      {paths[key]}
    </svg>
  );
}
