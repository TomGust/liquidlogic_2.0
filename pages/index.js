import Head from 'next/head';
import { useRef, useState, useEffect } from "react";
import TooltipWrapper from './api/TooltipWrapper';
import AmbientBackground from './api/AmbientBackground';
import MagneticWrapper from './api/MagneticWrapper';

const THEMES = [
  {
    id: 0,
    name: "צבא",
    baseColor: "#3C552D",
    background: "#1A1A19",
    tooltip: "#3C552D",
    highlightText: "#7bb459",
    icon: "#3C552D",
    selectedNote: "#292927bb",
    ambientColor: "blue",
    ambientOpacity: 0
  },
  {
    id: 1,
    name: "רגוע",
    baseColor: "#004985",
    background: "#00253B",
    tooltip: "#003764",
    highlightText: "#3ea8ff",
    icon: "#004985",
    selectedNote: "#00396a96",
    ambientColor: "#0037FF",
    ambientOpacity: 0.4
  },
  {
    id: 2,
    name: "רומטי",
    baseColor: "#c211aa",
    background: "#3f003c",
    tooltip: "#c211aa",
    highlightText: "#ff70ec",
    icon: "#c211aa",
    selectedNote: "#c211aa44",
    ambientColor: "#d60064",
    ambientOpacity: 0.4
  },
  {
    id: 3,
    name: "bgu",
    baseColor: "#ff6200",
    background: "#a33f00",
    tooltip: "#ff6200",
    highlightText: "#ffad32",
    icon: "#ff6200",
    selectedNote: "#ff620044",
    ambientColor: "#ffd900",
    ambientOpacity: 0.2
  },
  {
    id: 4,
    name: "אמוק",
    baseColor: "#360000",
    background: "#170000",
    tooltip: "#ac160b",
    highlightText: "#ac160b",
    icon: "#ac160b",
    selectedNote: "#ac160b36",
    ambientColor: "#360000",
    ambientOpacity: 0
  },
  {
    id: 0,
    name: "חד",
    baseColor: "#30330060",
    background: "#000000",
    tooltip: "#303300",
    highlightText: "#a8a300",
    icon: "#30330060",
    selectedNote: "#30330060",
    ambientColor: "#000000",
    ambientOpacity: 0
  }
];

const placeholderSentences = [
  // "כתוב כאן...",
  // "בוא נשמע מה יש לך להגיד...",
  // "בוא נעשה בזה סדר...",
  // "תראה מה אתה שווה..."
  "טוב לראות אותך!",
];

const getRandomPlaceholder = () =>
  placeholderSentences[Math.floor(Math.random() * placeholderSentences.length)];

const createNewNote = (color) => ({
  title: "",
  content: "",
  color: color || THEMES[0].baseColor,
  placeholder: ""  // ← ריק תמיד, מוגדר רק ב-useEffect
});

export default function Home() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState('');
  const textRef = useRef(null);
  const [deleteline, setDeleteLine] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // ✅ מצב "טקסט מסומן" - נדלק כשמסמנים טקסט בתוך ה-editor, ונכבה כשמפסיקים לסמן
  const [isTextSelected, setIsTextSelected] = useState(false);

  const [selectedNoteColor, setSelectedNoteColor] = useState(THEMES[0].baseColor);
  const activeStyle = THEMES.find(t => t.baseColor === selectedNoteColor) || THEMES[0];

  // ✅ פתק ראשוני בלי placeholder
  const [notes, setNotes] = useState([createNewNote()]);
  const [currentNoteIdx, setCurrentNoteIdx] = useState(0);

  // ✅ תיקון Hydration — placeholder מוגדר רק בקליינט אחרי mount
  useEffect(() => {
    setIsMounted(true);
    setNotes(prev =>
      prev.map(note => ({
        ...note,
        placeholder: note.placeholder || getRandomPlaceholder()
      }))
    );
  }, []);

  // ✅ מעקב אחרי בחירת טקסט בתוך ה-editor (textarea_content)
  // selectionchange נורה בכל שינוי בבחירה במסמך כולו, אז בודקים שהבחירה
  // אכן נמצאת בתוך ה-editor ושאינה ריקה (collapsed)
  useEffect(() => {
    const handleSelectionChange = () => {
      const selection = window.getSelection();
      const editor = textRef.current;

      if (!selection || selection.rangeCount === 0 || selection.isCollapsed || !editor) {
        setIsTextSelected(false);
        return;
      }

      const range = selection.getRangeAt(0);
      const isInsideEditor = editor.contains(range.commonAncestorContainer);

      setIsTextSelected(isInsideEditor);
    };

    document.addEventListener('selectionchange', handleSelectionChange);
    return () => document.removeEventListener('selectionchange', handleSelectionChange);
  }, []);

  // קיצורי מקלדת
  useEffect(() => {
    const handleShortcut = (e) => {
      if (e.ctrlKey && e.code === 'KeyQ') {
        e.preventDefault();
        handleNewNote();
      }
      if (e.code === 'Backquote') {
        e.preventDefault();
        if (isTextSelected) {
          colorSelectedText();
        } else {
          cycleNoteColor();
        }
      }
      if (e.ctrlKey && (e.code === 'Digit1' || e.code === 'Numpad1')) {
        e.preventDefault();
        if (isTextSelected) {
          clearSelectedTextStyle();
        } else {
          handleDeleteNote();
        }
      }
    };
    window.addEventListener('keydown', handleShortcut);
    return () => window.removeEventListener('keydown', handleShortcut);
  }, [activeStyle, notes, currentNoteIdx, isTextSelected]);

  useEffect(() => {
    const handleBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = "האם אתה בטוח שאתה רוצה לסגור את החלון?";
      return "האם אתה בטוח שאתה רוצה לסגור את החלון?";
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, []);

  useEffect(() => {
    if (textRef.current) {
      textRef.current.focus();
    }
  }, []);

  // עדכון תצוגה בעת מעבר בין פתקים
  useEffect(() => {
    setTitle(notes[currentNoteIdx]?.title || "");
    setContent(notes[currentNoteIdx]?.content || "");
    setSelectedNoteColor(notes[currentNoteIdx]?.color || THEMES[0].baseColor);
    if (textRef.current) {
      textRef.current.innerHTML = notes[currentNoteIdx]?.content || "";
    }
    // מעבר בין פתקים מבטל בחירת טקסט קודמת
    setIsTextSelected(false);
  }, [currentNoteIdx, notes]);

  const normalizeEditorHtml = (html) => {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    const textContent = tempDiv.textContent || '';
    const isEmpty = textContent.trim() === '';
    return { html: isEmpty ? '' : html, empty: isEmpty };
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const text = e.clipboardData?.getData('text/plain');
    if (!text) return;

    const escapedText = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\r\n/g, '\n')
      .replace(/\n/g, '<br>');

    document.execCommand('insertHTML', false, escapedText);

    const editor = textRef.current;
    if (!editor) return;

    const normalized = normalizeEditorHtml(editor.innerHTML);
    if (normalized.empty && editor.innerHTML !== '') {
      editor.innerHTML = '';
    }
    setContent(normalized.html);
  };

  const handleInput = () => {
    const editor = textRef.current;
    if (!editor) return;

    const rawHtml = editor.innerHTML;
    const normalized = normalizeEditorHtml(rawHtml);
    if (normalized.empty && editor.innerHTML !== '') {
      editor.innerHTML = '';
    }
    setContent(normalized.html);

    const selection = window.getSelection();
    if (!selection.rangeCount) return;

    const range = selection.getRangeAt(0);
    const node = selection.anchorNode;
    if (node.nodeType !== 3) return;

    const text = node.textContent;
    const offset = selection.anchorOffset;
    const lineStart = text.lastIndexOf('\n', offset - 1) + 1;
    const currentLine = text.substring(lineStart, offset);

    if (currentLine.trimStart().startsWith('* ')) {
      const leadingSpaces = currentLine.length - currentLine.trimStart().length;
      const replaceRange = document.createRange();
      replaceRange.setStart(node, lineStart + leadingSpaces);
      replaceRange.setEnd(node, lineStart + leadingSpaces + 2);
      selection.removeAllRanges();
      selection.addRange(replaceRange);
      document.execCommand('insertText', false, '• ');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      const selection = window.getSelection();
      if (!selection.rangeCount) return;

      const range = selection.getRangeAt(0);
      const node = selection.anchorNode;
      const text = node.textContent || '';
      const offset = range.startOffset;

      const lineStart = text.lastIndexOf('\n', offset - 1) + 1;
      const currentLine = text.substring(lineStart, offset);

      const bulletMatch = currentLine.match(/^\s*(•)\s/);
      const orderedMatch = currentLine.match(/^\s*(\d+)\.\s/);

      if (deleteline) {
        setDeleteLine(false);
        return;
      }

      if (currentLine.trim() === '') return;

      if (currentLine.trim() === '•' || currentLine.trim().match(/^\d+\.$/)) {
        e.preventDefault();
        const delRange = document.createRange();
        delRange.setStart(node, lineStart);
        delRange.setEnd(node, offset);
        delRange.deleteContents();
        document.execCommand('insertHTML', false, '<br>');
        setDeleteLine(true);
        return;
      }

      if (bulletMatch) {
        e.preventDefault();
        document.execCommand('insertLineBreak');
        document.execCommand('insertText', false, '• ');
      } else if (orderedMatch) {
        e.preventDefault();
        const nextNumber = parseInt(orderedMatch[1], 10) + 1;
        document.execCommand('insertLineBreak');
        document.execCommand('insertText', false, `${nextNumber}. `);
      }
    }
  };

  const handleTitleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (textRef.current) {
        textRef.current.focus();
        // מציב סמן בסוף התוכן הקיים
        const range = document.createRange();
        const sel = window.getSelection();
        range.selectNodeContents(textRef.current);
        range.collapse(false);
        sel.removeAllRanges();
        sel.addRange(range);
      }
    }
  };

  // ✅ "שינוי סגנון" בזמן שטקסט מסומן → מדגיש את הטקסט הנבחר.
  // הצבע עצמו לא נקבע כאן ישירות (inline style), אלא באמצעות class + CSS variable
  // (--highlight-color) שמוגדר על ה-editor. כך הצבע תמיד עוקב אחרי הסגנון הפעיל,
  // גם על הדגשות שנוצרו בעבר.
  const colorSelectedText = () => {
    const selection = window.getSelection();
    if (selection && !selection.isCollapsed && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const span = document.createElement('span');
      span.className = 'highlighted-text';
      span.textContent = selection.toString();
      range.deleteContents();
      range.insertNode(span);
      selection.removeAllRanges();
      if (textRef.current) setContent(textRef.current.innerHTML);
      setIsTextSelected(false);
    }
  };

  const clearSelectedTextStyle = () => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || selection.rangeCount === 0) return;

    const editor = textRef.current;
    if (!editor) return;

    const range = selection.getRangeAt(0);

    // מפצל את ה-span שגבול הבחירה (start/end) נמצא באמצעו,
    // כך שהגבול ייפול בדיוק על גבול של span ולא בתוכו
    const splitAtBoundary = (container, offset) => {
      if (container.nodeType !== Node.TEXT_NODE) return;

      let node = container;
      if (offset > 0 && offset < node.length) {
        node = node.splitText(offset); // node = החלק שמתחיל בדיוק בגבול
      } else if (offset === 0) {
        node = container;
      } else {
        return; // הגבול כבר בסוף הטקסט, אין מה לפצל
      }

      // מטפס למעלה ומפצל כל span.highlighted-text אבא, כל עוד הגבול באמצעו
      let current = node;
      let parent = current.parentNode;
      while (parent && parent !== editor && parent.classList?.contains('highlighted-text')) {
        const clone = parent.cloneNode(false); // span ריק עם אותו class
        let n = current;
        while (n) {
          const next = n.nextSibling;
          clone.appendChild(n);
          n = next;
        }
        parent.parentNode.insertBefore(clone, parent.nextSibling);
        current = clone;
        parent = clone.parentNode;
      }
    };

    // חשוב: מפצלים קודם את הסוף, כדי שהפיצול בהתחלה לא ישבש את ה-offset של הסוף
    // (רלוונטי בעיקר כששניהם באותו טקסט node)
    const endContainer = range.endContainer;
    const endOffset = range.endOffset;
    const startContainer = range.startContainer;
    const startOffset = range.startOffset;

    splitAtBoundary(endContainer, endOffset);
    splitAtBoundary(startContainer, startOffset);

    // אחרי הפיצול, יוצרים מחדש Range נקי מ-start עד end (לפי אותם containers/offsets המקוריים,
    // שעדיין תקפים כי splitText לא הזיז את הצמתים המקוריים, רק הוסיף חדשים אחריהם)
    const cleanRange = document.createRange();
    cleanRange.setStart(startContainer, Math.min(startOffset, startContainer.length ?? startOffset));
    cleanRange.setEnd(endContainer, Math.min(endOffset, endContainer.length ?? endOffset));

    // עכשיו כל span.highlighted-text שנחתך על ידי הבחירה חייב להיות *לגמרי* בתוכה
    // (כי פיצלנו בדיוק על הגבולות) - אז פשוט מפרקים אותו
    const spans = editor.querySelectorAll('span.highlighted-text');
    spans.forEach((span) => {
      if (cleanRange.intersectsNode(span)) {
        const parent = span.parentNode;
        while (span.firstChild) {
          parent.insertBefore(span.firstChild, span);
        }
        parent.removeChild(span);
      }
    });

    editor.normalize();
    selection.removeAllRanges();
    setContent(editor.innerHTML);
    setIsTextSelected(false);
  };

  const saveCurrentNote = () => {
    setNotes((prev) => {
      const updated = [...prev];
      updated[currentNoteIdx] = {
        ...updated[currentNoteIdx],
        title,
        content,
        color: selectedNoteColor
      };
      return updated;
    });
  };

  const handleNewNote = () => {
    if (notes.length >= 10) return;
    saveCurrentNote();
    const newNote = createNewNote(THEMES[0].baseColor);
    // ✅ placeholder מוגדר מיד כי אנחנו בקליינט
    newNote.placeholder = getRandomPlaceholder();
    setNotes((prev) => [...prev, newNote]);
    setCurrentNoteIdx(notes.length);
  };

  const handleDeleteNote = () => {
    if (notes.length > 1) {
      const newNotes = notes.filter((_, idx) => idx !== currentNoteIdx);
      setNotes(newNotes);
      setCurrentNoteIdx(Math.max(0, currentNoteIdx - 1));
    }
  };

  const cycleNoteColor = () => {
    const editor = textRef.current;
    if (editor) {
      setContent(editor.innerHTML);
    }

    const colors = THEMES.map(t => t.baseColor);
    const currentIndex = colors.indexOf(selectedNoteColor);
    const nextColor = colors[(currentIndex + 1) % colors.length];
    setSelectedNoteColor(nextColor);

    setNotes((prev) => {
      const updated = [...prev];
      updated[currentNoteIdx] = {
        ...updated[currentNoteIdx],
        content: editor ? editor.innerHTML : content,
        color: nextColor
      };
      return updated;
    });
  };

  const handleSelectNote = (idx) => {
    saveCurrentNote();
    setCurrentNoteIdx(idx);
  };

  const handleTitleChange = (e) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    setNotes((prev) => {
      const updated = [...prev];
      updated[currentNoteIdx] = { ...updated[currentNoteIdx], title: newTitle, content };
      return updated;
    });
  };

  const [draggedIdx, setDraggedIdx] = useState(null);
  const [dragOverIdx, setDragOverIdx] = useState(null);
  const [ghostPos, setGhostPos] = useState({ y: 0, x: 0, w: 0 });

  const handleDragStart = (e, idx) => {
    const emptyImage = new Image();
    emptyImage.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
    e.dataTransfer.setDragImage(emptyImage, 0, 0);

    const rect = e.currentTarget.getBoundingClientRect();
    const offsetY = e.clientY - rect.top;
    const offsetX = e.clientX - rect.left;

    setGhostPos({ y: rect.top, x: rect.left, w: rect.width, offsetX, offsetY });
    setDraggedIdx(idx);
    setDragOverIdx(idx);
    setCurrentNoteIdx(idx);
  };

  const handleDrag = (e) => {
    if (e.clientY === 0 && e.clientX === 0) return;

    setGhostPos(prev => {
      const startX = prev.startX ?? prev.x;
      const targetY = e.clientY - prev.offsetY;
      const targetX = e.clientX - prev.offsetX;
      const stretchDistance = Math.sqrt(Math.pow(targetX - startX, 2) + Math.pow(targetY - prev.y, 2));

      const MIN_Y = 60;
      const MAX_Y = notes.length * 45 + 35;
      const TENSION = 0.05;

      let newY = targetY;
      if (targetY < MIN_Y) {
        newY = MIN_Y - (MIN_Y - targetY) * TENSION;
      } else if (targetY > MAX_Y) {
        newY = MAX_Y + (targetY - MAX_Y) * TENSION;
      }

      let newX = startX + (targetX - startX) * TENSION;
      const newScale = Math.max(0.7, 1 - (stretchDistance / 1000));

      return { ...prev, startX, x: newX, y: newY, scale: newScale };
    });
  };

  const handleDragOver = (e, idx) => {
    e.preventDefault();
    if (dragOverIdx !== idx) {
      setDragOverIdx(idx);
    }
  };

  const handleDragEnd = () => {
    if (draggedIdx !== null && dragOverIdx !== null && draggedIdx !== dragOverIdx) {
      const newNotes = [...notes];
      const item = newNotes.splice(draggedIdx, 1)[0];
      newNotes.splice(dragOverIdx, 0, item);
      setNotes(newNotes);

      if (currentNoteIdx === draggedIdx) {
        setCurrentNoteIdx(dragOverIdx);
      } else if (draggedIdx < currentNoteIdx && dragOverIdx >= currentNoteIdx) {
        setCurrentNoteIdx(currentNoteIdx - 1);
      } else if (draggedIdx > currentNoteIdx && dragOverIdx <= currentNoteIdx) {
        setCurrentNoteIdx(currentNoteIdx + 1);
      }
    }

    setDraggedIdx(null);
    setDragOverIdx(null);
  };

  // חישוב הסגנון הבא לטולטיפ
  //לא פעיל כרגע
  const nextTheme = () => {
    const colors = THEMES.map(t => t.baseColor);
    const next = THEMES[(colors.indexOf(selectedNoteColor) + 1) % THEMES.length];
    // return `${activeStyle.name} ← ${next.name}`;
    return `${activeStyle.name}`;

  };

  return (
    <>
      <AmbientBackground baseColor={activeStyle.ambientColor} opacity={activeStyle.ambientOpacity} />

      <Head>
        <title>liquidlogic</title>
        <link rel="icon" href="./icon.svg" />
      </Head>

      <div style={{ display: "flex", height: "100vh" }}>
        <div
          className="background"
          style={{
            backgroundColor: activeStyle.background,
            transition: "background-color 0.5s ease",
          }}
        ></div>

        {/* Sidebar */}
        <div className="sidebar" style={{
          borderColor: activeStyle.selectedNote,
          transition: "background-color 0.5s ease",
        }}>
          <div className="perent-icon">
            <div className="icon">
              <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path fill={activeStyle.icon} d="M5.4 19.6C4.65 18.85 4.0625 17.9833 3.6375 17C3.2125 16.0167 3 15 3 13.95C3 12.9 3.2 11.8625 3.6 10.8375C4 9.8125 4.65 8.85 5.55 7.95C6.13333 7.36666 6.85417 6.86666 7.7125 6.45C8.57083 6.03333 9.5875 5.70416 10.7625 5.4625C11.9375 5.22083 13.2792 5.075 14.7875 5.025C16.2958 4.975 17.9833 5.03333 19.85 5.2C19.9833 6.96666 20.025 8.59166 19.975 10.075C19.925 11.5583 19.7875 12.8958 19.5625 14.0875C19.3375 15.2792 19.0208 16.3208 18.6125 17.2125C18.2042 18.1042 17.7 18.85 17.1 19.45C16.2167 20.3333 15.2792 20.9792 14.2875 21.3875C13.2958 21.7958 12.2833 22 11.25 22C10.1667 22 9.10833 21.7875 8.075 21.3625C7.04167 20.9375 6.15 20.35 5.4 19.6ZM8.2 19.2C8.68333 19.4833 9.17917 19.6875 9.6875 19.8125C10.1958 19.9375 10.7167 20 11.25 20C12.0167 20 12.775 19.8458 13.525 19.5375C14.275 19.2292 14.9917 18.7333 15.675 18.05C15.975 17.75 16.2792 17.3292 16.5875 16.7875C16.8958 16.2458 17.1625 15.5375 17.3875 14.6625C17.6125 13.7875 17.7833 12.7292 17.9 11.4875C18.0167 10.2458 18.0333 8.76666 17.95 7.05C17.1333 7.01666 16.2125 7.00416 15.1875 7.0125C14.1625 7.02083 13.1417 7.1 12.125 7.25C11.1083 7.4 10.1417 7.64166 9.225 7.975C8.30833 8.30833 7.55833 8.76666 6.975 9.35C6.225 10.1 5.70833 10.8417 5.425 11.575C5.14167 12.3083 5 13.0167 5 13.7C5 14.6833 5.1875 15.5458 5.5625 16.2875C5.9375 17.0292 6.26667 17.55 6.55 17.85C7.25 16.5167 8.175 15.2375 9.325 14.0125C10.475 12.7875 11.8167 11.7833 13.35 11C12.15 12.05 11.1042 13.2375 10.2125 14.5625C9.32083 15.8875 8.65 17.4333 8.2 19.2Z" />
              </svg>
            </div>
          </div>

          <div style={{ width: "100%", display: "flex", flexDirection: "column", position: "relative" }}>
            {notes.map((note, idx) => {
              let yOffset = "0px";
              if (draggedIdx !== null && dragOverIdx !== null && idx !== draggedIdx) {
                if (draggedIdx < dragOverIdx && idx > draggedIdx && idx <= dragOverIdx) {
                  yOffset = "-100%";
                } else if (draggedIdx > dragOverIdx && idx < draggedIdx && idx >= dragOverIdx) {
                  yOffset = "100%";
                }
              }

              return (
                <button
                  key={note.id || `note-${idx}`}
                  draggable
                  onDragStart={(e) => handleDragStart(e, idx)}
                  onDrag={(e) => handleDrag(e)}
                  onDragOver={(e) => handleDragOver(e, idx)}
                  onDragEnd={handleDragEnd}
                  onClick={() => handleSelectNote(idx)}
                  style={{
                    backgroundColor: idx === currentNoteIdx ? activeStyle.selectedNote : undefined,
                    cursor: draggedIdx === idx ? "grabbing" : "grab",
                    opacity: draggedIdx === idx ? 0 : 1,
                    transform: `translateY(${yOffset})`,
                    transition: draggedIdx !== null ? "transform 0.3s cubic-bezier(0.2, 1, 0.1, 1)" : undefined,
                  }}
                  className="note-button"
                >
                  {note?.title || `כותרת ${idx + 1}`}
                </button>
              );
            })}

            {draggedIdx !== null && (
              <div className="ghost-note" style={{
                position: "fixed",
                top: ghostPos.y,
                left: ghostPos.x,
                width: ghostPos.w,
                pointerEvents: "none",
                zIndex: 9999,
                background: activeStyle.selectedNote || "#ffffff",
                transform: `scaleY(${ghostPos.scale || 1})`,
              }}>
                {notes[draggedIdx]?.title || `כותרת ${draggedIdx + 1}`}
              </div>
            )}
          </div>

          <button
            onClick={handleNewNote}
            className={`new-note-button ${notes.length >= 10 ? 'hidden' : ''}`}
            style={{ opacity: notes.length >= 10 ? '0' : '1' }}
          >+</button>
        </div>

        {/* Editor */}
        <div className="container" style={{ flex: 1 }}>
          <div className="text_box">
            <input
              type="text"
              className="textarea_title"
              value={title}
              onChange={handleTitleChange}
              placeholder="כותרת"
              onKeyDown={handleTitleKeyDown}

            />
            {/*
              ✅ placeholder מוצג רק אחרי mount כדי למנוע hydration mismatch.
              ✅ --highlight-color מוגדר כאן ומועבר ל-.highlighted-text ב-CSS,
              כך שכל טקסט מודגש עוקב אוטומטית אחרי צבע ה-highlight של הסגנון הפעיל.
            */}
            <div
              className={`textarea_content ${content.length === 0 ? 'is-empty' : ''} ${isTextSelected ? 'has-selection' : ''}`}
              style={{ '--highlight-color': activeStyle.highlightText }}
              contentEditable={true}
              onInput={handleInput}
              onPaste={handlePaste}
              onKeyDown={handleKeyDown}
              ref={textRef}
              data-placeholder={isMounted ? (notes[currentNoteIdx]?.placeholder || "כתוב כאן...") : ""}
            >
            </div>
          </div>

          {/*
            ✅ שני הכפתורים הקיימים משנים את היעוד שלהם בזמן שטקסט מסומן:
            - כפתור ה"מחק" → מחזיר את הטקסט המסומן בלבד לעיצוב המקורי (מסיר הדגשה)
            - כפתור ה"שינוי סגנון" → מדגיש את הטקסט המסומן
            כשהבחירה מתבטלת, שני הכפתורים חוזרים אוטומטית להתנהגות המקורית שלהם.
          */}
          <TooltipWrapper
            text={isTextSelected ? "ניקוי" : "מחק"}
            shortcut="Control + 1"
            color={activeStyle.tooltip}
          >
            <MagneticWrapper pullRadius={35} strength={0.3}>
              <button
                onMouseDown={(e) => e.preventDefault()} // שומר על הבחירה בזמן הלחיצה
                onClick={isTextSelected ? clearSelectedTextStyle : handleDeleteNote}
                className={`delete-note-button ${isTextSelected ? 'is-clear-style-mode' : ''}`}
                style={{
                  borderColor: activeStyle.baseColor,
                  // '--x-position': isTextSelected ? "90px" : "40px"
                  '--x-position': "40px"
                }}
              />
            </MagneticWrapper>
          </TooltipWrapper>

          <TooltipWrapper
            text={isTextSelected ? "הדגש" : nextTheme()}
            shortcut="Backquote"
            color={activeStyle.tooltip}
          >
            <MagneticWrapper pullRadius={35} strength={0.3}>
              <button
                onMouseDown={(e) => e.preventDefault()} // שומר על הבחירה בזמן הלחיצה
                onClick={isTextSelected ? colorSelectedText : cycleNoteColor}
                className={`change-note-color-button ${isTextSelected ? 'is-highlight-mode' : ''}`}
                style={{
                  '--base-color': activeStyle.baseColor,
                  '--active-color': THEMES[(activeStyle.id + 1) % THEMES.length].baseColor,
                  // '--x-position': isTextSelected ? "40px" : "90px"
                  '--x-position': "90px"

                }}
              />
            </MagneticWrapper>
          </TooltipWrapper>
        </div>
      </div>
    </>
  );
}