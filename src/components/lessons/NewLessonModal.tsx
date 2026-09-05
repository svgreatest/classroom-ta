import React, { useState } from 'react';
import { FolderPlus, Sparkles, AlertCircle, X } from 'lucide-react';

interface NewLessonModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLessonCreated: (lessonId: string) => void;
}

export const NewLessonModal: React.FC<NewLessonModalProps> = ({
  isOpen,
  onClose,
  onLessonCreated,
}) => {
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [topic, setTopic] = useState('Data Structures and Algorithms');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleTitleChange = (val: string) => {
    setTitle(val);
    const autoSlug = val
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    if (!slug || slug.startsWith('0') || slug.includes('-')) {
      setSlug(`03-${autoSlug || 'new-lesson'}`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !slug.trim()) {
      setError('Please provide both a Lesson Title and a Folder Slug.');
      return;
    }

    setIsCreating(true);
    setError(null);

    try {
      const res = await fetch('/api/lessons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: slug.trim(),
          title: title.trim(),
          topic: topic.trim()
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create lesson folder hierarchy');
      }

      onLessonCreated(data.lessonId);
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 select-none animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden flex flex-col">
        <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
              <FolderPlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Create New Curriculum Lesson</h2>
              <p className="text-xs text-slate-400">Scaffolds folder hierarchy, slides.md, and C templates</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Lesson Title *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Red-Black Trees & Balancing"
              value={title}
              onChange={e => handleTitleChange(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-indigo-500 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Folder Name / Slug *
            </label>
            <div className="flex items-center bg-slate-950 border border-slate-800 rounded-lg overflow-hidden focus-within:border-indigo-500">
              <span className="px-3 py-2 text-xs font-mono text-slate-500 bg-slate-900 border-r border-slate-800">
                lessons/
              </span>
              <input
                type="text"
                required
                placeholder="03-binary-heaps"
                value={slug}
                onChange={e => setSlug(e.target.value)}
                className="w-full px-3 py-2 text-xs font-mono bg-slate-950 text-indigo-300 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Topic / Course Description
            </label>
            <input
              type="text"
              placeholder="e.g. Priority Queues, Binary Heaps, and HeapSort"
              value={topic}
              onChange={e => setTopic(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-indigo-500 transition"
            />
          </div>

          <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-[11px] font-mono text-slate-400 space-y-1">
            <span className="text-slate-300 font-bold block mb-1">Generated Directory Structure:</span>
            <div>📁 lessons/{slug || '03-your-lesson'}/</div>
            <div className="pl-4">├── 📄 lesson.json</div>
            <div className="pl-4">├── 📄 slides.md (with KaTeX and :::code placeholders)</div>
            <div className="pl-4">└── 📁 code/</div>
            <div className="pl-8">├── 📄 lesson.h</div>
            <div className="pl-8">├── 📄 lesson.c</div>
            <div className="pl-8">├── 📄 demo_main.c</div>
            <div className="pl-8">└── 📄 Makefile</div>
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 rounded-lg transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isCreating}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-lg shadow-indigo-600/30 transition disabled:opacity-50"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isCreating ? 'Scaffolding Lesson...' : 'Create Lesson Hierarchy'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};