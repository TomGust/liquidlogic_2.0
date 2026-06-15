import React, { useState } from 'react';

const DraggableNotesList = ({ 
  notes, 
  setNotes, 
  currentNoteIdx, 
  onSelectNote, 
  activeStyle = { selectedNote: '#e3f2fd' } // ערך דיפולטיבי אם לא מועבר
}) => {
  const [draggedIdx, setDraggedIdx] = useState(null);

  const handleDragStart = (e, idx) => {
    setDraggedIdx(idx);

    // יצירת תמונת "רוח" מרחפת בזמן הגרירה
    const ghostNode = e.target.cloneNode(true);
    ghostNode.style.position = "absolute";
    ghostNode.style.top = "-1000px";
    ghostNode.style.backgroundColor = "#fff9c4";
    ghostNode.style.boxShadow = "0 10px 20px rgba(0,0,0,0.2)";
    ghostNode.style.transform = "rotate(-2deg) scale(1.05)";
    ghostNode.style.opacity = "1";
    
    document.body.appendChild(ghostNode);
    e.dataTransfer.setDragImage(ghostNode, 20, 20);

    setTimeout(() => {
      document.body.removeChild(ghostNode);
    }, 0);
  };

  const handleDragEnter = (e, targetIdx) => {
    e.preventDefault();
    
    if (draggedIdx === null || draggedIdx === targetIdx) return;

    setNotes((prevNotes) => {
      const newNotes = [...prevNotes];
      const draggedItem = newNotes[draggedIdx];
      
      // החלפה בזמן אמת
      newNotes.splice(draggedIdx, 1);
      newNotes.splice(targetIdx, 0, draggedItem);
      
      return newNotes;
    });

    setDraggedIdx(targetIdx);
  };

  const handleDragEnd = () => {
    setDraggedIdx(null);
  };

  const handleDragOver = (e) => {
    e.preventDefault(); 
  };

  return (
    <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: "8px" }}>
      {notes.map((note, idx) => (
        <button
          key={note.id || `note-${idx}`} // חובה לוודא שיש מזהה ייחודי
          draggable
          onDragStart={(e) => handleDragStart(e, idx)}
          onDragEnter={(e) => handleDragEnter(e, idx)}
          onDragEnd={handleDragEnd}
          onDragOver={handleDragOver}
          onClick={() => onSelectNote(idx)}
          style={{
            background: idx === currentNoteIdx ? activeStyle.selectedNote : "transparent",
            cursor: draggedIdx === idx ? "grabbing" : "grab",
            opacity: draggedIdx === idx ? 0 : 1, // מעלים את המקור בזמן הגרירה
          }}
          className="note-button"
        >
          {note.title || `כותרת ${idx + 1}`}
        </button>
      ))}
    </div>
  );
};

export default DraggableNotesList;