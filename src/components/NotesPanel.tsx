import { useState, useCallback, useEffect } from 'react';
import { useStore } from '../store';
import type { Note } from '../types';
import './NotesPanel.css';

const NOTE_COLORS = [
  { name: 'default', bg: 'var(--color-bg-secondary)', fg: 'var(--color-text)' },
  { name: 'red', bg: '#5c1a1a', fg: '#ffcccc' },
  { name: 'orange', bg: '#5c3a1a', fg: '#ffddcc' },
  { name: 'yellow', bg: '#5c5a1a', fg: '#ffffcc' },
  { name: 'green', bg: '#1a5c2a', fg: '#ccffcc' },
  { name: 'teal', bg: '#1a4a5c', fg: '#ccffff' },
  { name: 'blue', bg: '#1a2a5c', fg: '#ccccff' },
  { name: 'purple', bg: '#3a1a5c', fg: '#ddccff' },
  { name: 'pink', bg: '#5c1a3a', fg: '#ffccee' },
  { name: 'gray', bg: '#3a3a3a', fg: '#dddddd' },
];

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function getNoteColorStyle(color: string) {
  const c = NOTE_COLORS.find(c => c.name === color) || NOTE_COLORS[0];
  return { backgroundColor: c.bg, color: c.fg };
}

function getNotePinnedColor() {
  return { color: '#ffd700' };
}

export function NotesPanel() {
  const { notes, noteTagFilter, setNoteTagFilter, searchQuery, addNote, updateNote, deleteNote } = useStore();
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setEditingId(null);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const allTags = Array.from(new Set(notes.flatMap(n => n.tags))).sort();

  const filteredNotes = notes
    .filter(n => {
      if (noteTagFilter && !n.tags.includes(noteTagFilter)) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const contentMatch = n.content.toLowerCase().includes(q);
        const tagMatch = n.tags.some(t => t.toLowerCase().includes(q));
        if (!contentMatch && !tagMatch) return false;
      }
      return true;
    })
    .sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      return b.updatedAt - a.updatedAt;
    });

  const handleAddNote = useCallback(() => {
    const note: Note = {
      id: generateId(),
      content: '',
      tags: [],
      color: 'default',
      pinned: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    addNote(note);
    setEditingId(note.id);
  }, [addNote]);

  const handleContentChange = useCallback((id: string, content: string) => {
    updateNote(id, { content });
  }, [updateNote]);

  const handleTagAdd = useCallback((id: string, tag: string) => {
    const note = notes.find(n => n.id === id);
    if (!note || !tag.trim()) return;
    const trimmed = tag.trim();
    if (note.tags.includes(trimmed)) return;
    updateNote(id, { tags: [...note.tags, trimmed] });
  }, [notes, updateNote]);

  const handleTagRemove = useCallback((id: string, tag: string) => {
    const note = notes.find(n => n.id === id);
    if (!note) return;
    updateNote(id, { tags: note.tags.filter(t => t !== tag) });
  }, [notes, updateNote]);

  const handleColorChange = useCallback((id: string, color: string) => {
    updateNote(id, { color });
  }, [updateNote]);

  const handleTogglePin = useCallback((id: string) => {
    const note = notes.find(n => n.id === id);
    if (!note) return;
    updateNote(id, { pinned: !note.pinned });
  }, [notes, updateNote]);

  const handleDelete = useCallback((id: string) => {
    if (editingId === id) setEditingId(null);
    deleteNote(id);
  }, [deleteNote, editingId]);

  return (
    <div className="notes-panel">
      <div className="notes-toolbar">
        <button className="notes-add-btn" onClick={handleAddNote}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M8 0a1 1 0 0 1 1 1v6h6a1 1 0 1 1 0 2H9v6a1 1 0 1 1-2 0V9H1a1 1 0 0 1 0-2h6V1a1 1 0 0 1 1-1z"/>
          </svg>
          Add note
        </button>
        {allTags.length > 0 && (
          <div className="notes-tags-filter">
            <button
              className={`notes-tag-filter-btn ${!noteTagFilter ? 'active' : ''}`}
              onClick={() => setNoteTagFilter('')}
            >
              All
            </button>
            {allTags.map(tag => (
              <button
                key={tag}
                className={`notes-tag-filter-btn ${noteTagFilter === tag ? 'active' : ''}`}
                onClick={() => setNoteTagFilter(noteTagFilter === tag ? '' : tag)}
              >
                {tag}
              </button>
            ))}
          </div>
        )}
      </div>

      {filteredNotes.length === 0 ? (
        <div className="notes-empty" onClick={handleAddNote}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          <div className="notes-empty-text">
            {searchQuery ? 'No notes match your search' : noteTagFilter ? 'No notes with this tag' : 'Create your first note'}
          </div>
        </div>
      ) : (
        <div className="notes-grid">
          {filteredNotes.map(note => (
            <NoteCard
              key={note.id}
              note={note}
              isEditing={editingId === note.id}
              onStartEdit={() => setEditingId(note.id)}
              onContentChange={handleContentChange}
              onTagAdd={handleTagAdd}
              onTagRemove={handleTagRemove}
              onColorChange={handleColorChange}
              onTogglePin={handleTogglePin}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface NoteCardProps {
  note: Note;
  isEditing: boolean;
  onStartEdit: () => void;
  onContentChange: (id: string, content: string) => void;
  onTagAdd: (id: string, tag: string) => void;
  onTagRemove: (id: string, tag: string) => void;
  onColorChange: (id: string, color: string) => void;
  onTogglePin: (id: string) => void;
  onDelete: (id: string) => void;
}

function NoteCard({
  note,
  isEditing,
  onStartEdit,
  onContentChange,
  onTagAdd,
  onTagRemove,
  onColorChange,
  onTogglePin,
  onDelete,
}: NoteCardProps) {
  const [tagInput, setTagInput] = useState('');
  const [showColorPicker, setShowColorPicker] = useState(false);
  const colorStyle = getNoteColorStyle(note.color);

  const handleKeyDown = useCallback((e: React.KeyboardEvent, id: string) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      onTagAdd(id, tagInput.trim());
      setTagInput('');
    }
    if (e.key === 'Backspace' && !tagInput && note.tags.length > 0) {
      onTagRemove(id, note.tags[note.tags.length - 1]);
    }
  }, [tagInput, note.tags, onTagAdd, onTagRemove]);

  return (
    <div
      className={`note-card ${note.pinned ? 'pinned' : ''}`}
      style={colorStyle}
      onClick={isEditing ? undefined : onStartEdit}
    >
      <div className="note-card-header">
        {note.pinned && (
          <span className="note-pin-icon" style={getNotePinnedColor()} title="Pinned">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M16 12V4h1V2H7v2h1v8l-2 2v2h5.2v6h1.6v-6H18v-2l-2-2z"/>
            </svg>
          </span>
        )}
      </div>
      {isEditing ? (
        <textarea
          className="note-card-textarea"
          value={note.content}
          onChange={(e) => onContentChange(note.id, e.target.value)}
          placeholder="Type your note..."
          autoFocus
          onClick={(e) => e.stopPropagation()}
        />
      ) : (
        <div className="note-card-content">
          {note.content || <span className="note-placeholder">Empty note</span>}
        </div>
      )}

      {note.tags.length > 0 && (
        <div className="note-tags">
          {note.tags.map(tag => (
            <span key={tag} className="note-tag">
              {tag}
              {isEditing && (
                <button
                  className="note-tag-remove"
                  onClick={(e) => { e.stopPropagation(); onTagRemove(note.id, tag); }}
                >
                  &times;
                </button>
              )}
            </span>
          ))}
        </div>
      )}

      {isEditing && (
        <div className="note-tag-input-wrap" onClick={(e) => e.stopPropagation()}>
          <input
            className="note-tag-input"
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => handleKeyDown(e, note.id)}
            placeholder="Add tag..."
          />
        </div>
      )}

      <div className="note-card-actions" onClick={(e) => e.stopPropagation()}>
        <button
          className="note-action-btn"
          onClick={() => onTogglePin(note.id)}
          title={note.pinned ? 'Unpin' : 'Pin'}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill={note.pinned ? '#ffd700' : 'none'} stroke="currentColor" strokeWidth="2">
            <path d="M16 12V4h1V2H7v2h1v8l-2 2v2h5.2v6h1.6v-6H18v-2l-2-2z"/>
          </svg>
        </button>
        <div className="note-color-picker-wrap">
          <button
            className="note-action-btn"
            onClick={() => setShowColorPicker(!showColorPicker)}
            title="Change color"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <circle cx="12" cy="12" r="5" fill="currentColor"/>
            </svg>
          </button>
          {showColorPicker && (
            <div className="note-color-picker">
              {NOTE_COLORS.map(c => (
                <button
                  key={c.name}
                  className={`note-color-swatch ${note.color === c.name ? 'active' : ''}`}
                  style={{ backgroundColor: c.bg }}
                  onClick={() => { onColorChange(note.id, c.name); setShowColorPicker(false); }}
                  title={c.name}
                />
              ))}
            </div>
          )}
        </div>
        <button
          className="note-action-btn note-delete-btn"
          onClick={() => onDelete(note.id)}
          title="Delete"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
          </svg>
        </button>
      </div>
    </div>
  );
}
