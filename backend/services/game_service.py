import time
from typing import Dict, Any, Optional, Tuple
from backend.models.game_models import Challenge, ChallengeStatus, GameType
from backend.games.tic_tac_toe import TicTacToeGame
from backend.games.bubble_shooter import BubbleShooterGame
from backend.games.speed_math import SpeedMathGame
from backend.games.science_quiz import ScienceQuizGame
from backend.utils.helpers import generate_id, log_event

class GameService:
    def __init__(self):
        self.challenges: Dict[str, Challenge] = {}

    def create_challenge(
        self,
        session_id: str,
        original_question: str,
        game_type: str,
        is_angry: bool = False
    ) -> Challenge:
        """
        Creates challenge, preserving original_question, scaling target based on mood.
        """
        challenge_id = generate_id("chal")
        target_score = None
        target_condition = None
        time_limit = None
        metadata: Dict[str, Any] = {}

        if game_type == GameType.TIC_TAC_TOE.value:
            target_condition = "PLAYER_WIN"
            metadata = {
                "board": TicTacToeGame.create_empty_board(),
                "status": "ONGOING",
                "is_angry": is_angry
            }
        elif game_type == GameType.BUBBLE_SHOOTER.value:
            target_score = BubbleShooterGame.ANGRY_TARGET_SCORE if is_angry else BubbleShooterGame.DEFAULT_TARGET_SCORE
            time_limit = BubbleShooterGame.ANGRY_TIME_LIMIT if is_angry else BubbleShooterGame.DEFAULT_TIME_LIMIT
            metadata = BubbleShooterGame.create_game_config(is_angry=is_angry)
        elif game_type == GameType.SPEED_MATH.value:
            target_score = SpeedMathGame.ANGRY_TARGET_CORRECT if is_angry else SpeedMathGame.DEFAULT_TARGET_CORRECT
            time_limit = SpeedMathGame.ANGRY_TIME_LIMIT if is_angry else SpeedMathGame.DEFAULT_TIME_LIMIT
            first_problem = SpeedMathGame.generate_problem(difficulty=3 if is_angry else 1)
            metadata = {
                "correct_count": 0,
                "current_problem": first_problem,
                "start_time": time.time(),
                "target_count": target_score,
                "time_limit": time_limit,
                "is_angry": is_angry
            }
        elif game_type == GameType.SCIENCE_QUIZ.value:
            target_score = ScienceQuizGame.TARGET_CORRECT
            metadata = {
                "correct_count": 0,
                "current_index": 0,
                "questions": [],
                "is_angry": is_angry
            }

        challenge = Challenge(
            challenge_id=challenge_id,
            session_id=session_id,
            original_question=original_question,
            game_type=game_type,
            target_score=target_score,
            target_condition=target_condition,
            time_limit=time_limit,
            status=ChallengeStatus.ACTIVE,
            created_at=time.time(),
            metadata=metadata
        )

        self.challenges[challenge_id] = challenge
        log_event("CHALLENGE_CREATED", session_id, challenge_id=challenge_id, game=game_type, angry=is_angry)
        return challenge

    def get_challenge(self, challenge_id: str) -> Optional[Challenge]:
        return self.challenges.get(challenge_id)

    def mark_challenge_won(self, challenge_id: str) -> bool:
        ch = self.challenges.get(challenge_id)
        if ch and ch.status == ChallengeStatus.ACTIVE:
            ch.status = ChallengeStatus.WON
            log_event("CHALLENGE_WON", ch.session_id, challenge_id=challenge_id)
            return True
        return False

    def mark_challenge_failed(self, challenge_id: str) -> bool:
        ch = self.challenges.get(challenge_id)
        if ch and ch.status == ChallengeStatus.ACTIVE:
            ch.status = ChallengeStatus.FAILED
            log_event("CHALLENGE_FAILED", ch.session_id, challenge_id=challenge_id)
            return True
        return False

    def validate_bubble_shooter(
        self,
        challenge: Challenge,
        score: int,
        client_won: bool
    ) -> Tuple[bool, str]:
        if challenge.status != ChallengeStatus.ACTIVE:
            return False, "Challenge is no longer active."

        valid, reason = BubbleShooterGame.validate_result(
            created_at=challenge.created_at,
            time_limit=challenge.time_limit or 30,
            target_score=challenge.target_score or 200,
            reported_score=score,
            client_won=client_won
        )

        if valid:
            challenge.status = ChallengeStatus.WON
            return True, reason
        else:
            challenge.status = ChallengeStatus.FAILED
            return False, reason

game_service = GameService()
