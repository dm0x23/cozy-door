import React, { useState } from 'react';
import { useStore } from '@nanostores/react';
import {
  tasksStore,
  taskFilterStore,
  widgetMinimizedStore,
  zenModeStore,
  type TaskItem,
} from '../stores/appStore';
import { useDraggable } from '../hooks/useDraggable';
import {
  CheckSquare,
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  Check,
  GripHorizontal,
} from 'lucide-react';

export const TasksWidget: React.FC = () => {
  const zenMode = useStore(zenModeStore);
  const tasks = useStore(tasksStore);
  const filter = useStore(taskFilterStore);
  const minimized = useStore(widgetMinimizedStore);

  const [inputText, setInputText] = useState('');

  const { position, dragHandleProps } = useDraggable('tasks', () => ({
    x: 24,
    y: 24,
  }));

  const isMinimized = minimized.tasks;

  const toggleMinimize = () => {
    widgetMinimizedStore.setKey('tasks', !isMinimized);
  };

  const addTask = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = inputText.trim();
    if (!trimmed) return;
    const newTask: TaskItem = {
      id: Date.now().toString(),
      text: trimmed,
      completed: false,
      createdAt: Date.now(),
    };
    tasksStore.set([newTask, ...tasks]);
    setInputText('');
  };

  const toggleTask = (id: string) => {
    tasksStore.set(
      tasks.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
    );
  };

  const deleteTask = (id: string) => {
    tasksStore.set(tasks.filter((t) => t.id !== id));
  };

  const filteredTasks = tasks.filter((t) => {
    if (filter === 'active') return !t.completed;
    if (filter === 'done') return t.completed;
    return true;
  });

  const completedCount = tasks.filter((t) => t.completed).length;

  if (zenMode) return null;

  return (
    <div
      style={{
        transform: `translate3d(${position.x}px, ${position.y}px, 0)`,
        position: 'fixed',
        top: 0,
        left: 0,
        width: '320px',
      }}
      className="z-40 select-none"
    >
      <div className="bg-[#1C1D22]/95 backdrop-blur-md border border-[#35373E] text-slate-100 rounded-2xl shadow-2xl overflow-hidden transition-all duration-200">
        {/* Header Bar (Draggable) */}
        <div
          {...dragHandleProps}
          className="px-4 py-3 bg-[#25272E] border-b border-white/5 flex items-center justify-between cursor-grab active:cursor-grabbing"
        >
          <div className="flex items-center space-x-2">
            <GripHorizontal className="w-4 h-4 text-slate-400" />
            <CheckSquare className="w-4 h-4 text-[#8EA2FF]" />
            <span className="text-sm font-semibold tracking-wide text-slate-100">Tasks</span>
            <span className="text-xs bg-white/10 text-slate-300 px-2 py-0.5 rounded-full font-mono">
              {completedCount}/{tasks.length}
            </span>
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleMinimize();
            }}
            className="w-7 h-7 rounded-lg hover:bg-white/10 text-slate-400 hover:text-slate-100 flex items-center justify-center transition-colors"
            title={isMinimized ? 'Expand' : 'Minimize'}
          >
            {isMinimized ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
        </div>

        {/* Card Body (Collapsible) */}
        {!isMinimized && (
          <div className="p-3.5 space-y-3">
            {/* Filter Tabs */}
            <div className="flex p-1 bg-[#16171b] rounded-lg border border-white/5 text-xs">
              {(['all', 'active', 'done'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => taskFilterStore.set(tab)}
                  className={`flex-1 py-1 rounded-md capitalize font-medium transition-all ${
                    filter === tab
                      ? 'bg-[#2b2e38] text-[#B8C4FF] shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Add Task Input Form */}
            <form onSubmit={addTask} className="flex items-center space-x-1.5">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Add a new task..."
                className="flex-1 bg-[#25272E] border border-white/10 rounded-xl px-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-[#8EA2FF]/50 transition-colors"
              />
              <button
                type="submit"
                className="w-8 h-8 rounded-xl bg-[#8EA2FF]/20 hover:bg-[#8EA2FF]/30 text-[#B8C4FF] flex items-center justify-center transition-all active:scale-95 border border-[#8EA2FF]/35"
                title="Add task"
              >
                <Plus className="w-4 h-4" />
              </button>
            </form>

            {/* Task Items List */}
            <div className="max-h-52 overflow-y-auto space-y-1.5 pr-1">
              {filteredTasks.length === 0 ? (
                <div className="text-center py-5 text-xs text-slate-500">
                  {filter === 'done'
                    ? 'No completed tasks yet'
                    : filter === 'active'
                    ? 'All tasks completed!'
                    : 'No tasks. Take a breath!'}
                </div>
              ) : (
                filteredTasks.map((task) => (
                  <div
                    key={task.id}
                    className={`group flex items-center justify-between p-2 rounded-xl border transition-all ${
                      task.completed
                        ? 'bg-[#1b1d22]/50 border-white/5 text-slate-500'
                        : 'bg-[#22242b] border-white/5 text-slate-200 hover:border-white/15'
                    }`}
                  >
                    <button
                      onClick={() => toggleTask(task.id)}
                      className={`w-4 h-4 rounded-md border flex items-center justify-center transition-colors mr-2.5 flex-shrink-0 ${
                        task.completed
                          ? 'bg-[#8EA2FF] border-[#8EA2FF] text-slate-900'
                          : 'border-slate-500 hover:border-[#8EA2FF]'
                      }`}
                    >
                      {task.completed && <Check className="w-3 h-3 stroke-[3]" />}
                    </button>

                    <span
                      onClick={() => toggleTask(task.id)}
                      className={`flex-1 text-xs text-left cursor-pointer break-words line-clamp-2 ${
                        task.completed ? 'line-through text-slate-500' : ''
                      }`}
                    >
                      {task.text}
                    </span>

                    <button
                      onClick={() => deleteTask(task.id)}
                      className="opacity-0 group-hover:opacity-100 w-6 h-6 rounded-md hover:bg-red-500/20 text-slate-500 hover:text-red-400 flex items-center justify-center transition-all ml-1.5 flex-shrink-0"
                      title="Delete task"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

