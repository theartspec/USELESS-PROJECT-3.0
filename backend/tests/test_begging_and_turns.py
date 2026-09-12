import pytest
from backend.services.personality_service import personality_service
from backend.services.chat_service import chat_service
from backend.games.speed_math import SpeedMathGame

def test_begging_analysis():
    # Asking permission to beg
    is_beg, score, is_asking, matched = personality_service.analyze_begging("can I beg for the answer?")
    assert is_beg is True
    assert is_asking is True

    # Weak begging
    is_beg, score, is_asking, matched = personality_service.analyze_begging("please?")
    assert is_beg is True
    assert score == 1
    assert "please" in matched

    # Strong English + Manglish begging
    is_beg, score, is_asking, matched = personality_service.analyze_begging("sorry please onn tharuvo!")
    assert is_beg is True
    assert score >= 3
    assert "onn tharuvo" in matched
    assert "please" in matched

def test_speed_math_settings():
    assert SpeedMathGame.DEFAULT_TARGET_CORRECT == 3
    assert SpeedMathGame.DEFAULT_TIME_LIMIT == 30
    assert SpeedMathGame.ANGRY_TIME_LIMIT == 20

@pytest.mark.asyncio
async def test_begging_flow_unlock():
    sess_id = "test_beg_unlock_sess"
    # First ask question
    res1 = await chat_service.process_chat(sess_id, "What is the capital of France?")
    assert res1.type in ["game", "ragebait", "ask_back", "refusal"]

    # Now beg with Manglish and English
    res2 = await chat_service.process_chat(sess_id, "sorry please onn tharuvo!")
    assert res2.type == "answer"
    assert "onn tharuvo" in res2.message.lower() or "paris" in res2.message.lower()
