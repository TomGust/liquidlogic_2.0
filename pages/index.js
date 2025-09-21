import Head from 'next/head';
import { useRef, useState, useEffect } from "react";

export default function Home() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState('');
  const textRef = useRef(null);
  const [selectedColor, setSelectedColor] = useState('#ea8e51ff'); // צבע טקסט
  const [deleteline, setDeleteLine] = useState(false);
  const [selectedNoteColor, setSelectedNoteColor] = useState("#3C552D"); // צבע פתק נוכחי

  // פתקים
  const [notes, setNotes] = useState([
    { title: "", content: "", color: "#3C552D" }
  ]);
  const [currentNoteIdx, setCurrentNoteIdx] = useState(0);


  // קיצור מקלדת: Ctrl+B לצביעת טקסט, Ctrl+N לפתקים חדשים, Ctrl+S לשמירה (דוגמה)
  useEffect(() => {
    const handleShortcut = (e) => {
      // Ctrl+y - צבע טקסט
      if (e.ctrlKey && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        colorSelectedText();
      }
      // Ctrl+q - פתק חדש
      if (e.ctrlKey && e.key.toLowerCase() === 'q') {
        e.preventDefault();
        handleNewNote();
      }
      // Ctrl+S - שמירה (דוגמה)
      if (e.ctrlKey && e.key.toLowerCase() === 's') {
        e.preventDefault();
        // כאן אפשר להוסיף לוגיקת שמירה
        console.log('שמירה...');
      }
      // Ctrl+1 - שנה צבע לאדום
      if (e.ctrlKey && e.key === '1') {
        e.preventDefault();
        // setSelectedColor('red');
      }
      // Ctrl+2 - שנה צבע לכחול
      if (e.ctrlKey && e.key === '2') {
        e.preventDefault();
        // setSelectedColor('blue');
      }
      // Ctrl+3 - שנה צבע לירוק
      if (e.ctrlKey && e.key === '3') {
        e.preventDefault();
        // setSelectedColor('green');
      }
    };
    window.addEventListener('keydown', handleShortcut);
    return () => window.removeEventListener('keydown', handleShortcut);
  }, []);

  useEffect(() => {
    const handleBeforeUnload = (e) => {
      // אם רוצים להראות הודעה מותאמת, חייבים להגדיר returnValue
      e.preventDefault();
      e.returnValue = "האם אתה בטוח שאתה רוצה לסגור את החלון?";
      return "האם אתה בטוח שאתה רוצה לסגור את החלון?";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []);


  // עדכון פתק נוכחי
  useEffect(() => {
    setTitle(notes[currentNoteIdx]?.title || "");
    setContent(notes[currentNoteIdx]?.content || "");
    setSelectedNoteColor(notes[currentNoteIdx]?.color || "red");
    if (textRef.current) {
      textRef.current.innerHTML = notes[currentNoteIdx]?.content || "";
    }
  }, [currentNoteIdx, notes]);

  const handleInput = () => {
    const editor = textRef.current;
    if (!editor) return;

    setContent(editor.innerHTML);

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

      const sel = window.getSelection();
      const node1 = sel.anchorNode.nodeType === 3 ? sel.anchorNode.parentElement : sel.anchorNode;
      if (deleteline) {
        setDeleteLine(false);
        return;
      }

      if (currentLine.trim() === '') return;

      // --- לוגיקה ליציאה מרשימה (נשארת כמעט זהה) ---
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

      // --- לוגיקה להמשך רשימה (החלק שתוקן) ---
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

  const colorSelectedText = () => {
    const selection = window.getSelection();
    if (!selection.isCollapsed) {
      const range = selection.getRangeAt(0);
      const span = document.createElement('span');
      span.style.color = selectedColor;
      span.textContent = selection.toString();

      range.deleteContents();
      range.insertNode(span);

      selection.removeAllRanges();
      if (textRef.current) setContent(textRef.current.innerHTML);
    }
  };

  // שמירת פתק נוכחי
  const saveCurrentNote = () => {
    setNotes((prev) => {
      const updated = [...prev];
      updated[currentNoteIdx] = { title, content, color: selectedNoteColor };

      return updated;
    });
  };

  // יצירת פתק חדש
  const handleNewNote = () => {
    if (notes.length >= 10) return; // הגבלה ל-10 פתקים
    saveCurrentNote();
    setNotes((prev) => [...prev, { title: "", content: "", color: "#3C552D" }]);
    setCurrentNoteIdx(notes.length);
  };

  // החלפת צבע בלחיצה (3 צבעים: red → blue → green)
  const cycleNoteColor = () => {
    // קודם נשמור את תוכן הפתק הנוכחי
    const editor = textRef.current;
    if (editor) {
      setContent(editor.innerHTML);
    }

    // עדכון הצבע
    const colors = ["#3C552D", "#EEE2B5", "#D7B26D"];
    const currentIndex = colors.indexOf(selectedNoteColor);
    const nextColor = colors[(currentIndex + 1) % colors.length];
    setSelectedNoteColor(nextColor);

    // עדכון הפתק כולל תוכן מעודכן
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

  // מעבר לפתק אחר
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

  // פונקציות Drag & Drop
  const [draggedIdx, setDraggedIdx] = useState(null);

  const handleDragStart = (idx) => {
    setDraggedIdx(idx);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (idx) => {
    if (draggedIdx === null || draggedIdx === idx) return;
    const updatedNotes = [...notes];
    const [removed] = updatedNotes.splice(draggedIdx, 1);
    updatedNotes.splice(idx, 0, removed);
    setNotes(updatedNotes);
    setCurrentNoteIdx(idx);
    setDraggedIdx(null);
  };

  return (
    <>
      <Head>
        <title>liquidlogic</title>
        <link rel="icon" href="./icon.svg" />
      </Head>
      <div style={{ display: "flex", height: "100vh" }}>
        <div
          className="background"
          style={{
            backgroundColor:
              selectedNoteColor === "#3C552D" ? "#1A1A19" :
                selectedNoteColor === "#EEE2B5" ? "#002930" :
                  selectedNoteColor === "#D7B26D" ? "#201A00" :
                    "#001eff5e",
            transition: "background-color 0.5s ease",
          }}
        ></div>

        {/* Sidebar */}

        <div className="sidebar" style={{
          borderColor:
            selectedNoteColor === "#3C552D" ? "#2C2C2A" :
              selectedNoteColor === "#EEE2B5" ? "#003943" :
                selectedNoteColor === "#D7B26D" ? "#312700" :
                  "#001eff5e",
          transition: "background-color 0.5s ease",

        }}>
          <div className="perent-icon">
            <div className="icon">
              <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path fill={notes[currentNoteIdx].color} d="M5.4 19.6C4.65 18.85 4.0625 17.9833 3.6375 17C3.2125 16.0167 3 15 3 13.95C3 12.9 3.2 11.8625 3.6 10.8375C4 9.8125 4.65 8.85 5.55 7.95C6.13333 7.36666 6.85417 6.86666 7.7125 6.45C8.57083 6.03333 9.5875 5.70416 10.7625 5.4625C11.9375 5.22083 13.2792 5.075 14.7875 5.025C16.2958 4.975 17.9833 5.03333 19.85 5.2C19.9833 6.96666 20.025 8.59166 19.975 10.075C19.925 11.5583 19.7875 12.8958 19.5625 14.0875C19.3375 15.2792 19.0208 16.3208 18.6125 17.2125C18.2042 18.1042 17.7 18.85 17.1 19.45C16.2167 20.3333 15.2792 20.9792 14.2875 21.3875C13.2958 21.7958 12.2833 22 11.25 22C10.1667 22 9.10833 21.7875 8.075 21.3625C7.04167 20.9375 6.15 20.35 5.4 19.6ZM8.2 19.2C8.68333 19.4833 9.17917 19.6875 9.6875 19.8125C10.1958 19.9375 10.7167 20 11.25 20C12.0167 20 12.775 19.8458 13.525 19.5375C14.275 19.2292 14.9917 18.7333 15.675 18.05C15.975 17.75 16.2792 17.3292 16.5875 16.7875C16.8958 16.2458 17.1625 15.5375 17.3875 14.6625C17.6125 13.7875 17.7833 12.7292 17.9 11.4875C18.0167 10.2458 18.0333 8.76666 17.95 7.05C17.1333 7.01666 16.2125 7.00416 15.1875 7.0125C14.1625 7.02083 13.1417 7.1 12.125 7.25C11.1083 7.4 10.1417 7.64166 9.225 7.975C8.30833 8.30833 7.55833 8.76666 6.975 9.35C6.225 10.1 5.70833 10.8417 5.425 11.575C5.14167 12.3083 5 13.0167 5 13.7C5 14.6833 5.1875 15.5458 5.5625 16.2875C5.9375 17.0292 6.26667 17.55 6.55 17.85C7.25 16.5167 8.175 15.2375 9.325 14.0125C10.475 12.7875 11.8167 11.7833 13.35 11C12.15 12.05 11.1042 13.2375 10.2125 14.5625C9.32083 15.8875 8.65 17.4333 8.2 19.2Z'/>" />
              </svg>
            </div>
          </div>

          <div style={{ width: "100%" }}>
            {notes.map((note, idx) => (
              <button
                key={idx}
                draggable
                onDragStart={() => handleDragStart(idx)}
                onDragOver={handleDragOver}
                onDrop={() => handleDrop(idx)}
                onClick={() => handleSelectNote(idx)}
                style={{
                  background: idx === currentNoteIdx ?
                    selectedNoteColor === "#3C552D" ? "#2C2C2A" :
                      selectedNoteColor === "#EEE2B5" ? "#003943" :
                        selectedNoteColor === "#D7B26D" ? "#312700" :
                          "#001eff5e" : selectedNoteColor === "#3C552D" ? "transparent" :
                      selectedNoteColor === "#EEE2B5" ? "transparent" :
                        selectedNoteColor === "#D7B26D" ? "transparent" :
                          "trensparent",
                  cursor: "grab"
                }}
                className="note-button"
              >
                {note.title || `כותרת ${idx + 1}`}
              </button>
            ))}

          </div>
          <button onClick={handleNewNote} className="new-note-button" style={{ transform: notes.length >= 10 ? 'scale(0)' : 'scale(1)' }}>
            +
          </button>
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
            />
            <div
              className={`textarea_content ${content.length === 0 ? 'is-empty' : ''}`}
              contentEditable={true}
              onInput={handleInput}
              onKeyDown={handleKeyDown}
              ref={textRef}
              data-placeholder="כתוב כאן..."
            >
            </div>
          </div>
          {/* <button onClick={colorSelectedText}>צבע טקסט</button> */}

          <button
            onClick={() => {
              if (notes.length > 1) {
                const newNotes = notes.filter((_, idx) => idx !== currentNoteIdx);
                setNotes(newNotes);
                setCurrentNoteIdx(Math.max(0, currentNoteIdx - 1));
              }
            }}
            className="delete-note-button"
            style={{ borderColor: selectedNoteColor }}
            disabled={notes.length === 1}
          >
          </button>

          <button onClick={cycleNoteColor} className="change-note-color-button" style={{ backgroundColor: selectedNoteColor }}></button>
        </div>
      </div >
    </>
  );
}