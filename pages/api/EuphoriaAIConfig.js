// EuphoriaAIConfig.js
// מודול מרכזי לכל הגדרות הפרומפטים והקריאות ל-AI.
// הקובץ הזה יודע להגדיר מה יש בפתק הנוכחי, מה יש בכותרת,
// מתי לקרוא ל-AI ואיך לבנות את הבקשה.
//
// כאן מוגדרים:
// 1. תבנית ההקשר לפתק (כותרת ותוכן)
// 2. הפרומפטים האוטומטיים שמופעלים בלי לחיצה
// 3. מבנה הבקשה ל-AI עבור שיחה ידנית
// 4. תנאי טריגר אוטומטי

const AI_SERVER_URL = "http://localhost:1234/v1/chat/completions";
const DEFAULT_MODEL = "local-model";

export const AI_TRIGGER_CONFIG = {
    minTriggerIntervalMs: 0,   // רשת ביטחון בין קריאות אוטומטיות
    minNoteLength: 20,             // מינימום תווים (כותרת + תוכן) לפני שמאפשרים טריגר
    idleTriggerDelayMs: 8000,      // עצירת כתיבה למשך זמן מסוים
    lengthMilestoneChars: 150,     // עלייה משמעותית באורך הפתק
    heartbeatIntervalMs: 90000,    // דופק תקופתי אם המשתמש עדיין פעיל
    heartbeatMaxIdleMs: 20000,     // הדופק נחשב רק אם המשתמש פעיל
    focusReturnMinAwayMs: 15000    // חזרה לטאב אחרי פרק זמן קצר
};

export const NOTE_CONTEXT_TEMPLATE = (title, content) => {
    const cleanTitle = (title || '').trim();
    const cleanContent = (content || '').trim();

    return `פתק נוכחי:
כותרת: "${cleanTitle}"
תוכן: "${cleanContent}"

השתמש במידע הזה כדי להבין את הכוונה של המשתמש. אם חלקים ריקים נמצאים, התעלם מהם.
`;
};

export const AUTO_PROMPTS = [
    (title, content) => `${NOTE_CONTEXT_TEMPLATE(title, content)}
אתה "המעורר".
התעלם מהפתק, נזוף בו קלות שיעזוב את המסך, ייצא החוצה ויקדם את החיים האמיתיים.
הגב בגובה העיניים, עד 2 שורות קצרות.`,

    (title, content) => `${NOTE_CONTEXT_TEMPLATE(title, content)}
אתה "הביקורתי".
קטול את הרעיון, מצא חורים בגישה ישירה, חסרת סבלנות וקצת עצבנית.
הגב עד 2 שורות קצרות וללא הנחות.`,

    (title, content) => `${NOTE_CONTEXT_TEMPLATE(title, content)}
אתה "המאתגר".
קח את הרעיון בפתק ואתגר את המשתמש לחשוב הרבה יותר בגדול ולפתח אותו.
הגב באנרגיה שדוחפת קדימה, עד 2 שורות קצרות.`,

    (title, content) => `${NOTE_CONTEXT_TEMPLATE(title, content)}
אתה "המחפש מה חסר".
מצא פרט שחסר בפתק והתחל תמיד ב: "בסגנון לדוגמא כמו... רק ראיתי שחסר לך...".
הגב עד 2 שורות קצרות וקולעות.`
];

export const buildAiSystemMessage = (noteTitle, noteContent) => {
    return `הקשר לשיחה:
${NOTE_CONTEXT_TEMPLATE(noteTitle, noteContent)}
הנחיות נוספות:
- התייחס רק לפרטים שבפתק הנוכחי.
- שמור על תשובה קצרה וברורה.
- אם השאלה הופנתה אליך ישירות, הגב כעוזר AI התומך בפתק.
- אם אין מספיק מידע, בקש למקד את השאלה.`;
};

export const buildAiRequestPayload = (messages) => ({
    model: DEFAULT_MODEL,
    messages,
    temperature: 0.7
});

export const buildAiMessages = (userText, noteTitle, noteContent) => {
    return [
        { role: "system", content: buildAiSystemMessage(noteTitle, noteContent) },
        { role: "user", content: userText }
    ];
};

export const canTriggerAuto = ({ noteTitle, noteContent, isPromptThinking, lastTriggerTime }) => {
    const now = Date.now();
    const combinedLength = (noteTitle || '').trim().length + (noteContent || '').trim().length;

    if (combinedLength < AI_TRIGGER_CONFIG.minNoteLength) return false;
    if (isPromptThinking) return false;
    if (now - lastTriggerTime < AI_TRIGGER_CONFIG.minTriggerIntervalMs) return false;

    return true;
};

export const callAiAPI = async (userText, noteTitle, noteContent) => {
    try {
        const payload = buildAiRequestPayload(buildAiMessages(userText, noteTitle, noteContent));

        const response = await fetch(AI_SERVER_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (!response.ok) {
            console.error("שגיאת API של LM Studio:", data);
            return "אירעה שגיאה בפנייה ל-AI.";
        }

        const textBlock = data.choices?.[0]?.message?.content;
        return textBlock || "לא התקבלה תשובה מה-AI.";
    } catch (err) {
        console.error("שגיאה בפנייה ל-AI:", err);
        return "אירעה שגיאה בפנייה ל-AI. ודא ש-LM Studio פועל ושהשרת המקומי הופעל.";
    }
};
