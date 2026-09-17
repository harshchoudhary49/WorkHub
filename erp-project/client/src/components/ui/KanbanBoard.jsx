import { useState } from 'react';
import TaskStatusBadge from './TaskStatusBadge.jsx';
import PriorityBadge from './PriorityBadge.jsx';

const COLUMNS = [
  { id: 'TODO',        label: 'To Do',      color: 'bg-slate-400' },
  { id: 'IN_PROGRESS', label: 'In Progress', color: 'bg-primary-500' },
  { id: 'REVIEW',      label: 'Review',      color: 'bg-amber-400' },
  { id: 'COMPLETED',   label: 'Done',        color: 'bg-rivet-500' },
  { id: 'BLOCKED',     label: 'Blocked',     color: 'bg-red-500' },
];

const isOverdue = (task) =>
  task.status !== 'COMPLETED' && new Date(task.dueDate) < new Date(new Date().toDateString());

function TaskCard({ task, onDragStart }) {
  return (
    <div
      draggable
      onDragStart={() => onDragStart(task)}
      className="group cursor-grab rounded-lg border border-slate-200 dark:border-gunmetal-600 bg-white dark:bg-gunmetal-800 p-3 shadow-sm transition-shadow hover:shadow-md active:cursor-grabbing active:opacity-70 active:scale-95 select-none"
    >
      <p className="text-sm font-medium text-slate-900 dark:text-white leading-snug">{task.title}</p>
      {task.description && (
        <p className="mt-1 text-xs text-slate-400 dark:text-gunmetal-400 line-clamp-2">{task.description}</p>
      )}
      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        <PriorityBadge priority={task.priority} />
        {isOverdue(task) && (
          <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-semibold text-red-600">
            overdue
          </span>
        )}
      </div>
      {task.dueDate && (
        <p className="mt-1.5 text-[10px] text-slate-400 dark:text-gunmetal-500">
          Due {new Date(task.dueDate).toLocaleDateString()}
        </p>
      )}
    </div>
  );
}

function Column({ col, tasks, onDrop, onDragOver }) {
  const [isDragOver, setIsDragOver] = useState(false);

  return (
    <div
      className="flex min-w-[220px] flex-col flex-1"
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragOver(true);
        onDragOver && onDragOver();
      }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={() => {
        setIsDragOver(false);
        onDrop(col.id);
      }}
    >
      {/* Column header */}
      <div className={`mb-3 flex items-center gap-2 rounded-t-lg border-t-4 ${col.color} bg-slate-50 dark:bg-gunmetal-900 px-3 py-2`}>
        <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
          {col.label}
        </span>
        <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-slate-200 dark:bg-gunmetal-700 text-[11px] font-bold text-slate-600 dark:text-slate-300">
          {tasks.length}
        </span>
      </div>

      {/* Drop zone */}
      <div
        className={`flex flex-1 flex-col gap-2 rounded-b-lg p-2 min-h-[120px] transition-colors ${
          isDragOver
            ? 'bg-primary-50 dark:bg-primary-900/20 ring-2 ring-primary-300 dark:ring-primary-700'
            : 'bg-slate-50/50 dark:bg-gunmetal-900/40'
        }`}
      >
        {tasks.length === 0 ? (
          <p className="mt-4 text-center text-xs text-slate-300 dark:text-gunmetal-600">
            Drop cards here
          </p>
        ) : (
          tasks.map((t) => (
            <TaskCard
              key={t._id}
              task={t}
              onDragStart={(task) => { /* set via parent */ }}
            />
          ))
        )}
      </div>
    </div>
  );
}

/**
 * KanbanBoard — drag-and-drop task board.
 *
 * Props:
 *   tasks: Task[]
 *   onStatusChange: (taskId, newStatus) => Promise<void>
 */
export default function KanbanBoard({ tasks = [], onStatusChange }) {
  const [draggedTask, setDraggedTask] = useState(null);

  const grouped = COLUMNS.reduce((acc, col) => {
    acc[col.id] = tasks.filter((t) => t.status === col.id);
    return acc;
  }, {});

  const handleDrop = async (newStatus) => {
    if (!draggedTask || draggedTask.status === newStatus) return;
    await onStatusChange(draggedTask._id, newStatus);
    setDraggedTask(null);
  };

  return (
    <div className="overflow-x-auto pb-4">
      <div className="flex gap-3 min-w-max">
        {COLUMNS.map((col) => (
          <div key={col.id} className="flex w-52 flex-col">
            {/* Column header */}
            <div
              className={`mb-3 flex items-center gap-2 rounded-t-md border-t-[3px] px-3 py-2 ${col.color} bg-slate-50 dark:bg-gunmetal-900`}
              style={{ borderTopColor: undefined }}
            >
              <div className={`h-2 w-2 rounded-full ${col.color}`} />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                {col.label}
              </span>
              <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-slate-200 dark:bg-gunmetal-700 text-[11px] font-bold text-slate-600 dark:text-slate-300">
                {grouped[col.id]?.length || 0}
              </span>
            </div>

            {/* Drop zone */}
            <div
              className="flex flex-col gap-2 rounded-b-md bg-slate-50/50 dark:bg-gunmetal-900/40 p-2 min-h-[200px]"
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => handleDrop(col.id)}
            >
              {(grouped[col.id] || []).length === 0 ? (
                <div className="flex flex-1 items-center justify-center">
                  <p className="text-xs text-slate-300 dark:text-gunmetal-600">Empty</p>
                </div>
              ) : (
                (grouped[col.id] || []).map((t) => (
                  <div
                    key={t._id}
                    draggable
                    onDragStart={() => setDraggedTask(t)}
                    onDragEnd={() => setDraggedTask(null)}
                    className={`cursor-grab rounded-lg border bg-white dark:bg-gunmetal-800 p-3 shadow-sm transition-all hover:shadow-md active:opacity-60 active:scale-95 select-none ${
                      isOverdue(t)
                        ? 'border-red-200 dark:border-red-900'
                        : 'border-slate-200 dark:border-gunmetal-600'
                    } ${draggedTask?._id === t._id ? 'opacity-40' : ''}`}
                  >
                    <p className="text-xs font-semibold text-slate-900 dark:text-white leading-snug">{t.title}</p>
                    {t.description && (
                      <p className="mt-0.5 text-[10px] text-slate-400 line-clamp-2">{t.description}</p>
                    )}
                    <div className="mt-2 flex flex-wrap items-center gap-1">
                      <PriorityBadge priority={t.priority} />
                      {isOverdue(t) && (
                        <span className="rounded-full bg-red-100 dark:bg-red-900/30 px-1.5 py-0.5 text-[9px] font-bold text-red-600 dark:text-red-400">
                          overdue
                        </span>
                      )}
                    </div>
                    {t.dueDate && (
                      <p className="mt-1 text-[9px] text-slate-400 dark:text-gunmetal-500">
                        Due {new Date(t.dueDate).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
