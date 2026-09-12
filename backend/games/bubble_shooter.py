import time
from typing import Dict, Any, Tuple

class BubbleShooterGame:
    DEFAULT_TARGET_SCORE = 200
    ANGRY_TARGET_SCORE = 500
    DEFAULT_TIME_LIMIT = 30  # seconds
    ANGRY_TIME_LIMIT = 25

    @classmethod
    def create_game_config(cls, is_angry: bool = False) -> Dict[str, Any]:
        target = cls.ANGRY_TARGET_SCORE if is_angry else cls.DEFAULT_TARGET_SCORE
        limit = cls.ANGRY_TIME_LIMIT if is_angry else cls.DEFAULT_TIME_LIMIT
        return {
            "target_score": target,
            "time_limit": limit,
            "colors": ["#ff2a85", "#00f0ff", "#ffe600", "#10b981", "#b842ff"],
            "bubble_radius": 20,
            "rows": 4,
            "cols": 8
        }

    @classmethod
    def validate_result(
        cls,
        created_at: float,
        time_limit: int,
        target_score: int,
        reported_score: int,
        client_won: bool
    ) -> Tuple[bool, str]:
        elapsed = time.time() - created_at
        # Allow 3 second network latency buffer
        if elapsed > (time_limit + 4.0):
            return False, f"Time expired! You took {int(elapsed)}s for a {time_limit}s challenge!"

        if reported_score < target_score:
            return False, f"Score too low! You scored {reported_score}, but I demanded {target_score} points!"

        return True, f"Challenge conquered! You achieved {reported_score} points! Vadakkunokki acknowledges your victory."
