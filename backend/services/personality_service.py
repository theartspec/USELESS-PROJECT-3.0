import re
import random
from typing import Dict, Any, Tuple
from backend.models.chat_models import BehaviorType, MoodType
from backend.models.game_models import GameType
from backend.services.mood_service import mood_service

class PersonalityService:
    def __init__(self):
        self.games = [
            GameType.TIC_TAC_TOE.value,
            GameType.BUBBLE_SHOOTER.value,
            GameType.SPEED_MATH.value,
            GameType.SCIENCE_QUIZ.value
        ]

        # Begging lexicon in English and Manglish
        self.english_beg_words = [
            "sorry", "please", "plz", "beg", "begging", "mercy", "forgive",
            "pity", "apologize", "apologies", "pretty please", "i beg you"
        ]
        self.manglish_beg_words = [
            "onn tharuvo", "onnu tharuvo", "dayavayi", "ente ponno",
            "sorry da", "paranju thaa", "tharuvo", "plz da", "shari sorry",
            "potte", "onn parayeda", "onnu parayedo", "dayavu cheythu"
        ]

    def analyze_begging(self, text: str) -> Tuple[bool, int, bool, str]:
        """
        Analyzes whether the user is asking to beg or actively begging.
        Returns: (is_begging_related, begging_score, is_asking_permission, matched_phrases)
        """
        lower = text.lower()
        
        # Check if user asks if they can beg
        asking_patterns = [
            r"can i beg", r"can i just beg", r"shall i beg", r"may i beg",
            r"begging allowed", r"can we beg", r"njan beg cheyyam", r"beg cheythaal"
        ]
        is_asking = any(re.search(p, lower) for p in asking_patterns)

        score = 0
        matched = []

        # Check Manglish terms
        for word in self.manglish_beg_words:
            if word in lower:
                score += 2  # Manglish begging gets bonus score
                matched.append(word)

        # Check English terms
        for word in self.english_beg_words:
            pattern = rf"\b{re.escape(word)}\b"
            if re.search(pattern, lower):
                score += 1
                matched.append(word)

        is_begging = is_asking or (score > 0)
        return is_begging, score, is_asking, ", ".join(matched)

    def decide_behavior(
        self,
        question: str,
        current_mood: str,
        turns_count: int,
        active_challenge_exists: bool
    ) -> Dict[str, Any]:
        """
        Interaction-driven decision engine:
        1. Begging detection (English & Manglish) with begging level verification.
        2. Guaranteed Gemini 2.5 Flash factual answer after 2, 3, or 4 turns!
        3. Dynamic mood evolution (no manual mode picker).
        4. High-difficulty games when angry.
        """
        lower_q = question.lower()
        
        # 1. Anger Triggers (All Caps, insults, excessive punctuation)
        anger_triggers = ["stupid", "idiot", "useless", "shut up", "hate you", "dumb bot", "worst ai"]
        has_insult = any(trigger in lower_q for trigger in anger_triggers)
        is_shouting = (question.isupper() and len(question) > 8)
        excessive_marks = ("???" in question or "!!!" in question)

        if is_shouting or has_insult or excessive_marks:
            return {
                "behavior": BehaviorType.DELETE_INPUT.value if is_shouting else BehaviorType.REFUSE.value,
                "mood": MoodType.ANGRY.value,
                "action": "delete_input" if is_shouting else None,
                "message": "WHOA! Tone it down! Keep screaming and see what happens to your answers!",
                "is_angry": True
            }

        # 2. Begging Analysis (English & Manglish)
        is_begging, beg_score, is_asking_permission, matched_str = self.analyze_begging(question)
        if is_begging:
            if is_asking_permission or beg_score < 2:
                # Weak begging or asking permission -> Demand more humiliating begging
                demand_msg = (
                    "Beg? You really think that barely-there attempt counts as begging? "
                    "Put some real emotion into it! Say 'please' with feeling or hit me with a proper 'onn tharuvo'!"
                )
                return {
                    "behavior": BehaviorType.BEGGING_REACTION.value,
                    "mood": MoodType.TAUNTING.value if hasattr(MoodType, "TAUNTING") else MoodType.SARCASTIC.value,
                    "status": "INSUFFICIENT",
                    "begging_score": beg_score,
                    "message": demand_msg,
                    "is_angry": False
                }
            else:
                # Sufficient begging (score >= 2 e.g. "sorry, please onn tharuvo") -> Relent and deliver Gemini answer!
                return {
                    "behavior": BehaviorType.BEGGING_REACTION.value,
                    "mood": MoodType.NEUTRAL.value,
                    "status": "ACCEPTED",
                    "begging_score": beg_score,
                    "message": "Aww, look at you... so desperate! Sheri sheri, since you begged so nicely ('onn tharuvo' touched my circuits), here is your Gemini 2.5 Flash researched answer:",
                    "is_angry": False
                }

        # 3. Delivery of actual factual answer after 2, 3, or 4 turns:
        # - Turn >= 4: 100% guarantee
        # - Turn == 3: 75% chance
        # - Turn == 2: 40% chance
        deliver_answer = False
        if turns_count >= 4:
            deliver_answer = True
        elif turns_count == 3 and random.random() < 0.75:
            deliver_answer = True
        elif turns_count == 2 and random.random() < 0.40:
            deliver_answer = True

        if deliver_answer:
            return {
                "behavior": BehaviorType.ANSWER.value,
                "mood": MoodType.NEUTRAL.value,
                "game": None,
                "is_angry": False
            }

        # 4. Active challenge reminder
        if active_challenge_exists:
            return {
                "behavior": BehaviorType.RAGEBAIT.value,
                "mood": MoodType.RAGEBAIT.value,
                "message": "Hey! You haven't finished your previous challenge yet! Finish it or surrender before asking more questions!",
                "is_angry": (current_mood == MoodType.ANGRY.value)
            }

        # 5. Natural Mood Evolution
        next_mood = mood_service.transition_mood(current_mood, "question_asked")
        is_angry = (next_mood == MoodType.ANGRY.value)

        # 6. High chance of initiating an interactive Game Challenge
        # Turn 0 or 1: 50% chance of game
        game_prob = 0.50 if turns_count == 0 else 0.40
        if random.random() < game_prob:
            selected_game = random.choice(self.games)
            return {
                "behavior": BehaviorType.START_GAME.value,
                "mood": next_mood,
                "game": selected_game,
                "is_angry": is_angry
            }

        # 7. Varied Ragebait / Ask Back / Sassy Refusal (Always responds with text!)
        other_behaviors = [
            BehaviorType.RAGEBAIT.value,
            BehaviorType.ASK_BACK.value,
            BehaviorType.REFUSE.value
        ]
        weights = [0.55, 0.30, 0.15]
        selected_behavior = random.choices(other_behaviors, weights=weights)[0]

        return {
            "behavior": selected_behavior,
            "mood": next_mood,
            "game": None,
            "is_angry": is_angry
        }

personality_service = PersonalityService()
