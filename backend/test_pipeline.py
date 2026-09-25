import os
import sys
import json
import logging
from unittest.mock import MagicMock, patch
from dotenv import load_dotenv

# Load environment
load_dotenv()

from fastapi.testclient import TestClient
from backend.main import app
from backend.database import Base, engine, SessionLocal, User, HealthJournalEntry

def safe_print(text: str):
    """Print helper that strips non-ASCII characters for Windows cp1252 console compatibility."""
    cleaned = text.encode("ascii", "ignore").decode("ascii")
    print(cleaned)

def run_tests():
    safe_print("=" * 60)
    safe_print("STARTING COMPREHENSIVE PCOS HEALTH COMPANION VERIFICATION")
    safe_print("=" * 60)
    
    # Initialize Test Database
    Base.metadata.create_all(bind=engine)
    client = TestClient(app)
    
    # TEST 1: User Registration & Authentication
    safe_print("\n[TEST 1] Register & Login User A...")
    user_a_email = f"testuser_{os.urandom(4).hex()}@example.com"
    user_a_pass = "SecurePass123!"
    
    reg_res = client.post("/api/auth/register", json={"email": user_a_email, "password": user_a_pass})
    assert reg_res.status_code == 200, f"Registration failed: {reg_res.text}"
    token_a = reg_res.json()["token"]
    safe_print(f"[SUCCESS] User A registered successfully. Email: {user_a_email}")

    # TEST 2: Free-Text Personal Feelings & Experience Journaling
    safe_print("\n[TEST 2] Save Free-Text Experience Journal Entry...")
    journal_payload = {
        "entryDate": "2026-09-25",
        "freeText": "I've been feeling anxious about my irregular periods.",
        "selectedSymptoms": ["irregularPeriods", "moodSwings"],
        "tags": ["#Mood", "#Cycle", "#Anxiety"],
        "consentForAI": True
    }
    
    j_res = client.post(
        "/api/journal",
        json=journal_payload,
        headers={"Authorization": f"Bearer {token_a}"}
    )
    assert j_res.status_code == 200, f"Journal save failed: {j_res.text}"
    entry_id = j_res.json()["entry"]["id"]
    safe_print(f"[SUCCESS] Journal entry saved successfully! ID: {entry_id}")
    safe_print(f"   AI Extraction: {j_res.json()['entry']['extractedInsights']}")

    # TEST 3: Journal Retrieval & Search
    safe_print("\n[TEST 3] Retrieve & Search Journal History...")
    hist_res = client.get(
        "/api/journal?search=anxious",
        headers={"Authorization": f"Bearer {token_a}"}
    )
    assert hist_res.status_code == 200
    entries = hist_res.json()
    assert len(entries) > 0, "Journal search returned empty"
    safe_print(f"[SUCCESS] Journal search returned {len(entries)} matching entry. Date: {entries[0]['entryDate']}")

    # TEST 4: Privacy Isolation Check
    safe_print("\n[TEST 4] User Privacy Isolation Check...")
    user_b_email = f"user_b_{os.urandom(4).hex()}@example.com"
    reg_b = client.post("/api/auth/register", json={"email": user_b_email, "password": "UserBPassword123!"})
    token_b = reg_b.json()["token"]
    
    b_hist = client.get("/api/journal", headers={"Authorization": f"Bearer {token_b}"})
    assert len(b_hist.json()) == 0, "Privacy Leak! User B was able to see User A's journal entries!"
    safe_print("[SUCCESS] Privacy check passed! User B cannot view User A's journal entries.")

    # TEST 5: Mocked OpenAI Integration Pipeline Test
    safe_print("\n[TEST 5] Mocked OpenAI Chat Execution with Empathetic Personality & Memory...")
    mock_openai_response = MagicMock()
    mock_message = MagicMock()
    mock_message.content = "Oh, I'm sorry you're feeling scared. Irregular periods can be worrying, especially when you don't know what's causing them. When did your last period start?"
    mock_message.tool_calls = None
    mock_openai_response.choices = [MagicMock(message=mock_message)]

    with patch("backend.openai_service.get_openai_client") as mock_get_client:
        mock_client = MagicMock()
        mock_client.chat.completions.create.return_value = mock_openai_response
        mock_get_client.return_value = mock_client

        # Send scared user prompt
        chat_res = client.post(
            "/api/chat",
            json={"message": "I'm scared about my irregular periods."},
            headers={"Authorization": f"Bearer {token_a}"}
        )
        assert chat_res.status_code == 200
        reply = chat_res.json()["reply"]
        assert "I'm sorry you're feeling scared" in reply
        safe_print(f"[SUCCESS] Chatbot Empathetic Response: '{reply}'")

        # Verify system prompt included User A's journal memory
        calls = mock_client.chat.completions.create.call_args_list
        system_msg_content = calls[0][1]["messages"][0]["content"]
        assert "USER RECENT JOURNAL MEMORY" in system_msg_content
        assert "feeling anxious about my irregular periods" in system_msg_content
        safe_print("[SUCCESS] Verified authentic Journal Memory context was injected into system prompt!")

    # TEST 6: Journal Edit & Delete
    safe_print("\n[TEST 6] Edit & Delete Journal Entry...")
    edit_res = client.put(
        f"/api/journal/{entry_id}",
        json={"freeText": "I'm feeling much better today after talking to my companion."},
        headers={"Authorization": f"Bearer {token_a}"}
    )
    assert edit_res.status_code == 200
    safe_print("[SUCCESS] Journal entry updated successfully.")
    
    del_res = client.delete(
        f"/api/journal/{entry_id}",
        headers={"Authorization": f"Bearer {token_a}"}
    )
    assert del_res.status_code == 200
    safe_print("[SUCCESS] Journal entry deleted successfully.")

    # TEST 7: Export Journal Data
    safe_print("\n[TEST 7] Export Journal Data...")
    exp_res = client.get("/api/journal/export", headers={"Authorization": f"Bearer {token_a}"})
    assert exp_res.status_code == 200
    safe_print(f"[SUCCESS] Export payload returned successfully.")

    safe_print("\n" + "=" * 60)
    safe_print("ALL VERIFICATION TESTS PASSED SUCCESSFULLY!")
    safe_print("=" * 60)

if __name__ == "__main__":
    run_tests()
