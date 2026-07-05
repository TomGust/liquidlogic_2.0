import React, { useState, useEffect, useRef, useCallback } from 'react';
import WavyDots from './WavyDots';
import MagneticWrapper from './MagneticWrapper';
import GlassEffect from './GlassEffect';
import { GlassFilterDefs } from "./GlassEffect";

// ==================== הגדרות מצב דמה (DEMO MODE) ====================
const USE_DUMMY_CHAT_MESSAGES = true;
const USE_DUMMY_PROMPT_ROTATION = true; 
// =======================================================================

// ==================== הגדרות טריגרים אוטומטיים ====================
const MIN_TRIGGER_INTERVAL_MS = 45000;   // רשת ביטחון: קירור חובה בין כל הפעלה, מכל מקור שהוא (ידני או אוטומטי)
const MIN_NOTE_LENGTH = 20;              // מינימום תווים (כותרת+תוכן) לפני שמאפשרים טריגר כלשהו
const IDLE_TRIGGER_DELAY_MS = 8000;      // טריגר 1: הפסקה בכתיבה
const LENGTH_MILESTONE_CHARS = 150;      // טריגר 2: קפיצת אורך
const HEARTBEAT_INTERVAL_MS = 90000;     // טריגר 4: דופק תקופתי
const HEARTBEAT_MAX_IDLE_MS = 20000;     // הדופק פועל רק אם המשתמש עדיין "פעיל" סביב הפתק
const FOCUS_RETURN_MIN_AWAY_MS = 15000;  // טריגר 5: מינימום זמן היעדרות מהטאב
// =======================================================================

const PROMPTS_LIST = [
    (title, content) => `הקשר - זהו פתק שהמשתמש כותב כרגע:
אתה "המעורר". התעלם מהפתק, נזוף בו קלות שיעזוב את המסך, ייצא החוצה ויקדם את החיים האמיתיים.
הגב בגובה העיניים, עד 2 שורות קצרות.`,

    (title, content) => `הקשר - זהו פתק שהמשתמש כותב כרגע:
אתה "הביקורתי". קטול את הרעיון, מצא חורים בגישה ישירה, חסרת סבלנות וקצת עצבנית.
הגב עד 2 שורות קצרות וללא הנחות.`,

    (title, content) => `הקשר - זהו פתק שהמשתמש כותב כרגע:
אתה "המאתגר". קח את הרעיון בפתק ואתגר את המשתמש לחשוב הרבה יותר בגדול ולפתח אותו.
הגב באנרגיה שדוחפת קדימה, עד 2 שורות קצרות.`,

    (title, content) => `הקשר - זהו פתק שהמשתמש כותב כרגע:
אתה "המחפש מה חסר". מצא פרט שחסר בפתק והתחל תמיד ב: "בסגנון לדוגמא כמו... רק ראיתי שחסר לך...".
הגב עד 2 שורות קצרות וקולעות.`
];

const WordRevealAnimation = ({ text }) => {
    const words = text.split(' ');
    return (
        <div className="ai-message-text custom-font" style={{ whiteSpace: 'pre-wrap' }}>
            {words.map((word, index) => (
                <span key={index} className="reveal-word" style={{ '--word-index': index }}>
                    {word}{' '}
                </span>
            ))}
        </div>
    );
};

const DecorativeSVG = ({ className, color }) => (
    <svg className={className} width="89" height="184" viewBox="0 0 89 184" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path opacity="0.3" fillRule="evenodd" clipRule="evenodd" d="M2.51873 45.4015C1.71491 42.589 1.10343 39.722 0.688773 36.8215V28.3712C16.0119 28.5273 30.719 34.6028 41.8963 45.3939L2.51873 45.4015ZM-2.59331 45.4015C-1.75612 42.5567 -1.11897 39.6434 -0.689261 36.669V28.3712C-16.0123 28.5273 -30.7195 34.6028 -41.8967 45.3939H-2.60072L-2.59331 45.4015ZM-42.8451 46.8277H-3.03783C-3.61652 48.6278 -4.27662 50.3991 -5.01597 52.1358C-8.07383 59.6653 -12.4995 66.5249 -18.0554 72.3465L-42.8451 46.8277ZM-44.801 45.4015H-66.8494V46.8277H-45.2529C-56.3121 58.658 -62.5593 74.393 -62.7153 90.8106H-88.9053V92.2292H-62.7153C-62.5593 108.647 -56.3121 124.382 -45.2529 136.212H-66.8494V137.631H-44.801V160.335H-43.4155V138.104C-31.9232 149.488 -16.6378 155.919 -0.689261 156.08V183.04H0.688773V156.08C16.6373 155.919 31.9227 149.488 43.415 138.104V160.335H44.7931V137.631H66.8489V136.212H45.2524C56.3116 124.382 62.5589 108.647 62.7148 92.2292H88.9048V90.8106H62.7148C62.5589 74.393 56.3116 58.658 45.2524 46.8277H66.8489V45.4015H44.7931V22.7046H43.415V44.9363C31.9227 33.5518 16.6373 27.1208 0.688773 26.9602V0H-0.689261V26.9602C-16.6378 27.1208 -31.9232 33.5518 -43.4155 44.9363V22.7046H-44.801V45.4015ZM0.688773 154.661C16.0129 154.503 30.7201 148.424 41.8963 137.631H2.51873C1.71859 140.43 1.11107 143.297 0.688773 146.218V154.661ZM-0.689261 146.371C-1.11788 143.413 -1.75675 140.492 -2.60072 137.631H-41.8967C-30.7206 148.424 -16.0133 154.503 -0.689261 154.661V146.371ZM-61.3373 90.8106H-53.1358C-50.3182 90.3838 -47.5331 89.7544 -44.801 88.9268V48.3911C-55.2837 59.8972 -61.1856 75.0368 -61.3373 90.8106ZM-53.284 92.2292H-61.3447C-61.193 108.003 -55.2911 123.143 -44.8084 134.649V94.1968C-47.5855 93.3283 -50.4134 92.6707 -53.284 92.2292ZM61.3294 90.8106C61.1777 75.0368 55.2758 59.8972 44.7931 48.3911V88.9268C47.5121 89.7505 50.2978 90.3759 53.1353 90.8106H61.3294ZM53.2835 92.2292C50.3941 92.6715 47.5639 93.3274 44.7931 94.1968V134.649C55.2785 123.144 61.1831 108.004 61.3368 92.2292H53.2835ZM43.415 135.625V94.6468C41.6663 95.2424 39.9456 95.9219 38.2586 96.6831C30.9441 99.8308 24.2805 104.387 18.6254 110.106L43.415 135.625ZM43.415 88.4921V46.9268L43.3261 46.8277H2.94103C3.5041 48.6199 4.14125 50.3969 4.8673 52.1358C8.0702 59.7792 12.642 66.7337 18.3438 72.6363C24.0771 78.5086 30.833 83.2174 38.2586 86.5168C39.9477 87.2566 41.6666 87.9125 43.415 88.4921ZM-43.4155 136.121V94.6468C-41.6745 95.2417 -39.9482 95.9205 -38.259 96.6831C-30.8203 99.8859 -24.0568 104.546 -18.3443 110.403C-12.654 116.284 -8.12735 123.247 -5.01597 130.904C-4.27509 132.643 -3.60831 134.412 -3.03783 136.212H-43.3266L-43.4155 136.121ZM-43.4155 88.4921V48.2462L-19.0407 73.3379C-24.6256 78.8839 -31.1358 83.3482 -38.259 86.5168C-39.9478 87.2556 -41.6684 87.9148 -43.4155 88.4921ZM2.94103 136.212H42.037L17.6622 111.12C12.2747 116.869 7.93795 123.571 4.8599 130.904C4.14211 132.642 3.50183 134.414 2.94103 136.212ZM-14.4473 76.6479C-20.5967 82.9508 -27.8324 88.02 -35.7845 91.5962C-27.819 95.0792 -20.5759 100.102 -14.4473 106.392C-8.33685 112.701 -3.45783 120.157 -0.0743334 128.357C3.39965 120.171 8.32396 112.722 14.4468 106.392C20.5754 100.102 27.8185 95.0792 35.784 91.5962C27.8319 88.02 20.5962 82.9508 14.4468 76.6479C8.32383 70.3178 3.3995 62.8692 -0.0743334 54.6831C-3.45783 62.8829 -8.33685 70.3391 -14.4473 76.6479Z" fill={color} />
    </svg>
);

// ==================== קריאה ל-AI ====================
const callAiAPI = async (userText, noteTitle, noteContent) => {
    try {
        const url = "http://localhost:1234/v1/chat/completions";

        const systemMessage = userText

        //         const systemMessage = `זהו פתק שהמשתמש כותב כרגע וזהו ההקשר לשיחה:
        // כותרת: "${noteTitle || ''}"
        // תוכן: "${noteContent || ''}"

        // התייחס לפתק הזה כשרלוונטי לשאלות המשתמש. המשתמש כתב:"${userText || ''}"`;

        console.log(systemMessage)
        const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                model: "local-model",
                messages: [
                    { role: "system", content: systemMessage },
                    { role: "user", content: userText }
                ],
                temperature: 0.7
            })
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

const EuphoriaChatContainer = ({
    baseColor = "#3C552D",
    apiKey = "",
    noteTitle = "",
    noteContent = ""
}) => {
    const [messages, setMessages] = useState([]);
    const [inputValue, setInputValue] = useState('');
    const [isThinking, setIsThinking] = useState(false);
    const [copiedMessageId, setCopiedMessageId] = useState(null);
    const [promptCopied, setPromptCopied] = useState(false);
    const bottomRef = useRef(null);

    const [currentPredefinedMessageIndex, setCurrentPredefinedMessageIndex] = useState(0);
    const predefinedMessages = [
        { text: "חשוב להבין את ההשלכות של כל פעולה." },
        { text: "מה?" },
        { text: "אני חושב שכן" },
        { text: "A beautiful, smooth word-by-word reveal animation." }
    ];

    const [dynamicPromptText, setDynamicPromptText] = useState("");
    const [isPromptThinking, setIsPromptThinking] = useState(false);

    // ==================== רפרנסים לטריגרים האוטומטיים ====================
    const noteTitleRef = useRef(noteTitle);
    const noteContentRef = useRef(noteContent);
    const lastTriggerTimeRef = useRef(0);          // רשת הביטחון המרכזית
    const isPromptThinkingRef = useRef(false);
    const lastEditTimeRef = useRef(Date.now());
    const idleTimerRef = useRef(null);
    const lastContentLengthAtTriggerRef = useRef(0);
    const paragraphCountRef = useRef(0);
    const hiddenAtRef = useRef(null);
    // =======================================================================

    // בדיקה מרכזית: זו נקודת השער היחידה שדרכה עובר כל טריגר, ידני או אוטומטי
    const canTriggerNow = () => {
        const now = Date.now();
        const combinedLength = (noteTitleRef.current || '').trim().length + (noteContentRef.current || '').trim().length;

        if (combinedLength < MIN_NOTE_LENGTH) return false;          // פתק ריק/קצר מדי - לא מפעילים
        if (isPromptThinkingRef.current) return false;               // כבר יש בקשה בתהליך
        if (now - lastTriggerTimeRef.current < MIN_TRIGGER_INTERVAL_MS) return false; // קירור חובה - ללא יוצא מן הכלל

        return true;
    };

    const triggerRandomPrompt = useCallback(async () => {
        if (!canTriggerNow()) return;

        // ננעל מיידית, לפני ה-await, כדי למנוע מרוץ בין טריגרים שנורים כמעט בו-זמנית
        lastTriggerTimeRef.current = Date.now();

        if (PROMPTS_LIST.length === 0) return;

        const randomPromptFn = PROMPTS_LIST[Math.floor(Math.random() * PROMPTS_LIST.length)];
        const randomPrompt = randomPromptFn(noteTitleRef.current, noteContentRef.current);

        if (USE_DUMMY_PROMPT_ROTATION) {
            setDynamicPromptText(randomPrompt);
            return;
        }

        isPromptThinkingRef.current = true;
        setIsPromptThinking(true);
        const answer = await callAiAPI(randomPrompt, noteTitleRef.current, noteContentRef.current);
        isPromptThinkingRef.current = false;
        setIsPromptThinking(false);
        setDynamicPromptText(answer);
    }, []);

    // קיצור מקלדת - Ctrl+3 (נשאר כמו שהיה, רק שעכשיו עובר דרך אותה פונקציה משותפת)
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.ctrlKey && e.key === '3') {
                e.preventDefault();
                triggerRandomPrompt();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [triggerRandomPrompt]);

    // טריגר 1 + 2 + 3: הפסקה בכתיבה / קפיצת אורך / פסקה חדשה - כולם תלויים בשינויי הפתק
    useEffect(() => {
        noteTitleRef.current = noteTitle;
        noteContentRef.current = noteContent;
        lastEditTimeRef.current = Date.now();

        // טריגר 3: פסקה חדשה - ירידת שורה כפולה (Enter פעמיים) בתוכן
        const paragraphCount = (noteContent || '').split(/\n\s*\n/).length - 1;
        if (paragraphCount > paragraphCountRef.current) {
            paragraphCountRef.current = paragraphCount;
            triggerRandomPrompt();
        }

        return () => {
            if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
        };
    }, [noteTitle, noteContent, triggerRandomPrompt]);



    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isThinking]);

    const handleCopyMessage = (id, text) => {
        navigator.clipboard.writeText(text).then(() => {
            setCopiedMessageId(id);
            setTimeout(() => setCopiedMessageId(null), 1500);
        }).catch((err) => {
            console.error("שגיאה בהעתקה:", err);
        });
    };

    const handleCopyPrompt = () => {
        if (!dynamicPromptText || isPromptThinking) return;
        navigator.clipboard.writeText(dynamicPromptText).then(() => {
            setPromptCopied(true);
            setTimeout(() => setPromptCopied(false), 1500);
        }).catch((err) => {
            console.error("שגיאה בהעתקה:", err);
        });
    };

    const handleSendMessage = async () => {
        if (inputValue.trim() === '' || isThinking) return;

        const userText = inputValue;
        const newUserMessage = { id: Date.now(), type: 'user', text: userText };
        setMessages(prev => [...prev, newUserMessage]);
        setInputValue('');
        setIsThinking(true);

        let aiText;

        if (USE_DUMMY_CHAT_MESSAGES) {
            aiText = await new Promise((resolve) => {
                setTimeout(() => {
                    const safeIndex = currentPredefinedMessageIndex % predefinedMessages.length;
                    resolve(predefinedMessages[safeIndex]?.text || "");
                }, 1500);
            });
            setCurrentPredefinedMessageIndex(prev => (prev + 1) % predefinedMessages.length);
        } else {
            aiText = await callAiAPI(userText, noteTitle, noteContent);
        }

        setIsThinking(false);
        setMessages(prevMessages => {
            const newAiMessage = {
                id: Date.now() + Math.random(),
                type: 'ai',
                text: aiText,
                isNew: true
            };
            const updatedMessages = prevMessages.map(msg =>
                msg.type === 'ai' ? { ...msg, isNew: false } : msg
            );
            return [...updatedMessages, newAiMessage];
        });
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !isThinking) handleSendMessage();
    };

    return (
        <div className="euphoria-chat-wrapper" style={{ '--base-color': baseColor }}>
            <DecorativeSVG className="decoration top-left-graphic" color={baseColor} />
            <DecorativeSVG className="decoration bottom-right-graphic" color={baseColor} />

            <div className="empty-chat-placeholder custom-font" style={{
                opacity: messages.length === 0 && !isThinking ? 1 : 0,
                top: messages.length === 0 && !isThinking ? '40%' : '45%',
                '--base-color': baseColor
            }}>
                <p>איך אפשר לעזור?</p>
            </div>

            <div className="chat-center-wrapper">
                <div className="anti-squish-container">
                    <div className="chat-content-container">
                        <div className="messages-list">
                            {messages.map((message) => (
                                message.type === 'user' ? (
                                    <div key={message.id} className="message-bubble user-message">
                                        <div className="user-message-text" style={{ '--base-color': baseColor }}>
                                            {message.text}
                                        </div>
                                    </div>
                                ) : (
                                    <div
                                        key={message.id}
                                        className="message-bubble ai-message"
                                        onClick={() => handleCopyMessage(message.id, message.text)}
                                        style={{ cursor: 'pointer', position: 'relative' }}
                                    // title="לחץ להעתקה"
                                    >
                                        {message.isNew ? (
                                            <WordRevealAnimation text={message.text} />
                                        ) : (
                                            <div className="ai-message-text custom-font" style={{ whiteSpace: 'pre-wrap' }}>{message.text}</div>
                                        )}
                                    </div>
                                )
                            ))}

                            {isThinking && (
                                <div className="ai-message-bubble thinking-message">
                                    <div className="thinking-content">
                                        <div className="thinking-icon">
                                            <span className="dot top"></span>
                                            <span className="dot bottom-right"></span>
                                            <span className="dot bottom-left"></span>
                                        </div>
                                        <div className="thinking-text custom-font">חושב...</div>
                                    </div>
                                </div>
                            )}

                            <div ref={bottomRef}></div>
                        </div>
                    </div>

                    <div
                        className="dynamic-prompt-container"
                        key={dynamicPromptText}
                        onClick={handleCopyPrompt}
                        style={{ cursor: dynamicPromptText && !isPromptThinking ? 'pointer' : 'default' }}
                    // title="לחץ להעתקה"
                    >
                        <p className="dynamic-prompt-text custom-font">
                            {isPromptThinking ? "חושב..." : dynamicPromptText}
                        </p>
                    </div>


                    <div className="input-glow-fx" style={{
                        opacity: isThinking ? 1 : 0.3,
                        bottom: isThinking ? '-10px' : '-40px',
                    }}
                    >
                        <WavyDots
                            isColorful={true}
                            dotSize={0.2}
                            spacing={15}
                            speed={0.0003}
                        />
                    </div>
                    <div className="input-glow-bg"></div>
                    {/* <div className="input-glow-bg_2"></div> */}

                    <MagneticWrapper pullRadius={160} strength={0.02}>

                        <div className="input-row-container">
                            <GlassFilterDefs />

                            <GlassEffect>
                                <div className="input-pill-wrapper glass-effect"
                                >

                                    <input
                                        type="text"
                                        value={inputValue}
                                        onChange={(e) => setInputValue(e.target.value)}
                                        onKeyDown={handleKeyDown}
                                        placeholder="יש לך שאלה?"
                                        className="input-font"
                                    />

                                    <MagneticWrapper pullRadius={65} strength={0.1}>
                                        <button
                                            className="send-btn-circle"
                                            style={{ '--base-color': baseColor, opacity: isThinking ? 0.5 : 1, cursor: isThinking ? 'not-allowed' : 'pointer' }}
                                            onClick={handleSendMessage}
                                            disabled={isThinking}
                                        >
                                            <svg width="10" height="11" viewBox="0 0 8 9" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <path d="M7.60759 8.17018C7.67587 8.34025 7.66205 8.50152 7.56613 8.65399C7.4702 8.80647 7.33071 8.8825 7.14766 8.88208L4.67078 8.88208L3.82505 5.20886L2.97931 8.88208L0.502435 8.88208C0.318962 8.88208 0.179473 8.80584 0.0839669 8.65337C-0.0115394 8.50089 -0.025572 8.33962 0.0418688 8.16955L3.35254 0.307881C3.44679 0.102627 3.60513 -3.4486e-07 3.82756 -3.54583e-07C4.04957 -3.64287e-07 4.20623 0.102627 4.29755 0.307881L7.60759 8.17018Z" fill="white" />
                                            </svg>
                                        </button>
                                    </MagneticWrapper>
                                </div>
                            </GlassEffect>

                        </div>
                    </MagneticWrapper>

                </div>
            </div>
        </div >
    );
};

export default EuphoriaChatContainer;