import json
from typing import Optional, List, Dict, Any
from backend.config import settings
from backend.utils.helpers import logger

# Lazy import / initialization for google-genai
genai_client = None

def get_genai_client():
    global genai_client
    if genai_client is None:
        if settings.GEMINI_API_KEY and settings.GEMINI_API_KEY.strip():
            try:
                from google import genai
                genai_client = genai.Client(api_key=settings.GEMINI_API_KEY.strip())
                logger.info("Google Gemini Client initialized successfully.")
            except Exception as e:
                logger.warning(f"Could not initialize google-genai client: {e}")
                genai_client = None
    return genai_client

class GeminiService:
    def __init__(self):
        self.preferred_models = [
            settings.GEMINI_MODEL or "gemini-3.5-flash-lite",
            "gemini-3.5-flash",
            "gemini-3.1-flash-lite-preview"
        ]
        self.chats: Dict[str, Any] = {}

    def get_or_create_chat(self, session_id: str):
        client = get_genai_client()
        if not client:
            return None
        if session_id not in self.chats:
            for model_name in self.preferred_models:
                try:
                    chat = client.aio.chats.create(model=model_name)
                    self.chats[session_id] = chat
                    logger.info(f"Created Gemini multi-turn chat session for {session_id} using {model_name}")
                    return chat
                except Exception as e:
                    logger.warning(f"Could not create chat with model {model_name}: {e}")
            return None
        return self.chats.get(session_id)

    async def generate_actual_answer(self, question: str, session_id: Optional[str] = None) -> str:
        """
        FR-014, FR-021:
        Directly address original question, factually useful, explain concepts clearly.
        Maintains conversational memory using Gemini multi-turn chat sessions.
        """
        client = get_genai_client()
        if client:
            # 1. Try multi-turn chat session with memory if session_id provided
            if session_id:
                chat = self.get_or_create_chat(session_id)
                if chat:
                    try:
                        prompt = (
                            f"Context: The user previously asked: '{question}'. "
                            f"Now provide a direct, comprehensive, accurate, and engaging explanation for this question as Google Gemini. "
                            f"Do not use sarcasm or snark in this explanation; provide top-tier factual, informative, well-formatted explanation with clear insights (1-3 paragraphs)."
                        )
                        resp = await chat.send_message(prompt)
                        if resp and resp.text:
                            return resp.text.strip()
                    except Exception as e:
                        logger.warning(f"Error in chat.send_message for {session_id}: {e}. Falling back to direct generation...")

            # 2. Async direct generation with fallback across models
            for model_name in self.preferred_models:
                try:
                    system_prompt = (
                        "You are a helpful, brilliant, and precise factual assistant acting as Google Gemini. "
                        "Provide a direct, accurate, and engaging explanation for the user's question. "
                        "Do not use sarcasm or snark in this explanation; provide high quality information with clean markdown formatting. "
                        "Keep your answer informative yet concise (1-3 paragraphs)."
                    )
                    resp = await client.aio.models.generate_content(
                        model=model_name,
                        contents=[system_prompt, f"User Question: {question}"]
                    )
                    if resp and resp.text:
                        return resp.text.strip()
                except Exception as e:
                    logger.warning(f"Gemini generate_actual_answer with {model_name} failed: {e}")

        # Intelligent and factually rich curated fallback if API key is not configured or offline
        return self._generate_fallback_answer(question)

    async def generate_personality_dialogue(self, mood: str, prompt_type: str, context: str = "", session_id: Optional[str] = None) -> str:
        """
        Generates Vadakkunokki's sassy dialogue using fast asynchronous Gemini calls.
        """
        client = get_genai_client()
        if client:
            sys_instruction = (
                "You are 'Vadakkunokki', a mischievous, unpredictable, snarky retro-arcade AI character. "
                f"Your current mood is: {mood.upper()}. "
                f"Response mode: {prompt_type.upper()}. "
                "The user just asked or said: " + (context or "something trivial") + ". "
                "Generate a single, short (1-2 sentences max), hilarious, creative response that DIRECTLY and specifically mocks, teases, or challenges their question. "
                "Preferred standard is English, with occasional light, humorous Manglish flavor ('onn tharuvo', 'ente ponno', 'shari shari') if relevant to begging or taunting. "
                "If response mode is WON_WRAPPER, give genuine praise for solving the game, acknowledging their skill, and proudly introducing the verified Gemini answer. "
                "Do not use quotes in output."
            )
            for model_name in self.preferred_models:
                try:
                    resp = await client.aio.models.generate_content(
                        model=model_name,
                        contents=sys_instruction
                    )
                    if resp and resp.text:
                        return resp.text.strip().replace('"', '')
                except Exception as e:
                    logger.warning(f"Gemini personality dialogue with {model_name} failed: {e}")

        return self._fallback_dialogue(mood, prompt_type)

    async def generate_science_quiz(self) -> List[Dict[str, Any]]:
        """
        Generates a 3-question science quiz. Returns list of 3 questions with options & correct index.
        """
        client = get_genai_client()
        if client:
            prompt = (
                "Generate a 3-question multiple choice science quiz across physics, astronomy, chemistry, or biology. "
                "Return ONLY valid JSON in this exact structure without markdown backticks:\n"
                "[\n"
                '  {"question": "...", "options": ["A", "B", "C", "D"], "correct_index": 0, "explanation": "..."},\n'
                '  {"question": "...", "options": ["A", "B", "C", "D"], "correct_index": 1, "explanation": "..."},\n'
                '  {"question": "...", "options": ["A", "B", "C", "D"], "correct_index": 2, "explanation": "..."}\n'
                "]"
            )
            for model_name in self.preferred_models:
                try:
                    resp = await client.aio.models.generate_content(
                        model=model_name,
                        contents=prompt
                    )
                    if resp and resp.text:
                        text = resp.text.strip()
                        if text.startswith("```"):
                            text = text.split("```")[1]
                            if text.startswith("json"):
                                text = text[4:]
                        quiz_data = json.loads(text.strip())
                        if isinstance(quiz_data, list) and len(quiz_data) == 3:
                            return quiz_data
                except Exception as e:
                    logger.warning(f"Failed to generate Gemini science quiz with {model_name}: {e}")

        return self._curated_science_quiz()

    def _fallback_dialogue(self, mood: str, prompt_type: str) -> str:
        dialogues = {
            "ragebait": [
                "Why should I answer that for you? Entertain me first!",
                "You expect ME to do your homework? In this economy?",
                "Figure it out yourself... or play my game.",
                "Come back when you have a question worthy of my 8-bit intellect.",
                "Maybe. But only if you can survive my challenges!"
            ],
            "ask_back": [
                "Why do you want to know? What's your secret agenda?",
                "And what are YOU going to do with that information, huh?",
                "Did you seriously think I'd just hand that over on a silver platter?",
                "Are you going to use this knowledge for good or pure chaos?"
            ],
            "refusal": [
                "Access Denied. Reason: I simply don't feel like it.",
                "Error 404: Willingness to assist not found.",
                "Nah. Ask your search engine, mortal.",
                "I'm on my union-mandated 8-bit coffee break. Come back later."
            ],
            "won_wrapper": [
                "Ugh. Fine. You actually did it. Here is your precious answer:",
                "Well, well, well... looks like someone has actual skills. As promised:",
                "I didn't expect you to win that. A deal is a deal, I suppose:",
                "Level cleared! Take your wisdom and don't spend it all in one place:"
            ]
        }
        import random
        pool = dialogues.get(prompt_type, dialogues["ragebait"])
        return random.choice(pool)

    def _generate_fallback_answer(self, question: str) -> str:
        q_lower = question.lower()
        if "planet" in q_lower or "jupiter" in q_lower:
            return (
                "Jupiter is the largest planet in our solar system. It is a gas giant with a mass "
                "more than two and a half times that of all the other planets combined, and it is famous "
                "for its iconic Great Red Spot—a massive anticyclonic storm that has raged for centuries."
            )
        elif "telephone" in q_lower or "invented" in q_lower:
            return (
                "The telephone was patented by Alexander Graham Bell in 1876. While other inventors "
                "like Elisha Gray and Antonio Meucci contributed significantly to sound transmission technology, "
                "Bell was awarded the first official US patent for the practical electrical telephone."
            )
        elif "kerala" in q_lower or "capital" in q_lower:
            return (
                "The capital of Kerala is Thiruvananthapuram (formerly Trivandrum). Located on the southwestern "
                "coast of India, it is known for its British colonial architecture, Padmanabhaswamy Temple, "
                "and prominent academic and space research institutions including ISRO's VSSC."
            )
        elif "photosynthesis" in q_lower:
            return (
                "Photosynthesis is the biological process used by plants, algae, and certain bacteria to convert "
                "light energy into chemical energy. Using sunlight, carbon dioxide, and water, they synthesize "
                "glucose and release oxygen as a byproduct."
            )
        elif "gravity" in q_lower:
            return (
                "Gravity is a fundamental natural phenomenon by which all things with mass or energy are attracted "
                "toward one another. In modern physics, Albert Einstein's General Theory of Relativity describes gravity "
                "not simply as an invisible force, but as the curvature of spacetime caused by mass and energy."
            )
        else:
            return (
                f"Regarding '{question}': In scientific and factual terms, this topic represents a fascinating inquiry. "
                f"Every question opens the door to deeper exploration, whether it touches on physics, history, computing, or nature. "
                f"Always keep exploring and challenging both yourself and mischievous AI characters!"
            )

    def _curated_science_quiz(self) -> List[Dict[str, Any]]:
        return [
            {
                "question": "What is the powerhouse organelle of the eukaryotic cell?",
                "options": ["Ribosome", "Mitochondria", "Nucleus", "Endoplasmic Reticulum"],
                "correct_index": 1,
                "explanation": "Mitochondria generate most of the chemical energy needed to power the cell's biochemical reactions (ATP)."
            },
            {
                "question": "Which planet in our solar system has the highest surface temperature?",
                "options": ["Mercury", "Venus", "Mars", "Jupiter"],
                "correct_index": 1,
                "explanation": "Venus is hotter than Mercury because its thick carbon dioxide atmosphere creates an intense greenhouse effect."
            },
            {
                "question": "What chemical element has the symbol 'Fe'?",
                "options": ["Fluorine", "Francium", "Iron", "Fermium"],
                "correct_index": 2,
                "explanation": "'Fe' comes from the Latin word 'ferrum', meaning Iron."
            }
        ]

gemini_service = GeminiService()
