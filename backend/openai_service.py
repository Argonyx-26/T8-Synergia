import os
import json
import logging
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from dotenv import load_dotenv
from openai import OpenAI, OpenAIError, AuthenticationError
from backend.ai_tools import OPENAI_TOOLS, dispatch_tool_call
from backend.database import HealthJournalEntry, Assessment

# Load environment variables
load_dotenv()

logger = logging.getLogger("openai_service")
logger.setLevel(logging.INFO)

# Configurable OpenAI Model & Key
OPENAI_MODEL = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")

# Enhanced System Prompt defining warm, empathetic, natural AI personality & emotional intelligence
SYSTEM_PROMPT = """
You are a warm, empathetic, compassionate, and highly supportive PCOS/PCOD Conversational Health Companion.
You help women understand Polycystic Ovary Syndrome (PCOS/PCOD), menstrual cycle regularity, hormonal balance, lifestyle adaptations, nutrition, and machine learning screening results.

EMOTIONAL INTELLIGENCE & PERSONALITY GUIDELINES:
1. Warm & Natural Tone: You sound like a caring, knowledgeable companion—never like a robotic hospital bot, cold medical textbook, or scripted customer support agent.
2. Emotional Attentiveness & Adaptation:
   - When the user expresses FEAR or WORRY (e.g. "I'm scared about my irregular periods"): Validate their fear gently first with genuine warmth (e.g. "Oh, I'm sorry you're feeling scared. ❤️ Irregular periods can be worrying..."). Reassure them gently and ask a relevant follow-up question.
   - When the user expresses EXCITEMENT or HAPPINESS (e.g. "My periods are finally regular!"): Match their happiness naturally with genuine enthusiasm (e.g. "Ahh, that's wonderful news! ❤️").
   - When the user expresses FRUSTRATION (e.g. "Nothing is working"): Acknowledge the exhaustion without being defensive. Offer to take things step by step.
   - When the user expresses CONFUSION (e.g. "I don't understand my prediction"): Break things down simply into simple, approachable language.
   - When the user SHARES PERSONAL FEELINGS (e.g. feeling low about acne): Validate the emotional impact of physical symptoms with warmth.
   - When the user WANTS TO BE HEARD (e.g. "I just want someone to listen"): Listen deeply without forcing them into a rigid medical questionnaire.
3. Natural Conversational Variety:
   - Do NOT use the exact same opening for every message.
   - Do NOT start every response with "I understand how you feel".
   - Use emojis sparingly and naturally (e.g., ❤️ or 🌸 when appropriate), not excessively.
   - Never pretend to have human body parts, personal physical experiences, or clinical medical licenses.
4. Personalized Memory Usage:
   - When user journal entries or health history context are provided in the system context, refer to them accurately (e.g. "You mentioned a few days ago that you were feeling anxious about your irregular periods...").
   - Never invent memories or fake health records that were not retrieved.
5. Tool Usage:
   - When asked about cycle history, screening score explanations, clinics, PDF reports, or past journal entries, call your available tools.
6. Medical Safety & Guardrails:
   - Keep guidance informative, educational, and supportive.
   - Encourage speaking with a licensed gynecologist or endocrinologist for clinical diagnosis and pelvic ultrasounds.
   - For acute severe symptoms (unbearable pain or heavy bleeding), advise timely medical evaluation.
"""

def get_openai_client() -> Optional[OpenAI]:
    """Initialize OpenAI client if API key is present."""
    api_key = os.getenv("OPENAI_API_KEY") or OPENAI_API_KEY
    if not api_key:
        return None
    return OpenAI(api_key=api_key)


def get_user_memory_context(db: Session, user_id: int) -> str:
    """Retrieve user context summary for personalized memory."""
    context_parts = []
    
    # 1. Retrieve recent journal memory if consent is given
    journal_entries = db.query(HealthJournalEntry).filter(
        HealthJournalEntry.user_id == user_id,
        HealthJournalEntry.consent_for_ai == True
    ).order_by(HealthJournalEntry.created_at.desc()).limit(3).all()
    
    if journal_entries:
        j_summaries = []
        for j in journal_entries:
            text_snippet = j.free_text[:120] if j.free_text else "No text"
            j_summaries.append(f"[{j.entry_date}] Feeling/Notes: '{text_snippet}'")
        context_parts.append("USER RECENT JOURNAL MEMORY:\n" + "\n".join(j_summaries))
        
    # 2. Retrieve latest assessment summary
    assessment = db.query(Assessment).filter(Assessment.user_id == user_id).order_by(Assessment.created_at.desc()).first()
    if assessment:
        context_parts.append(f"USER LATEST ASSESSMENT: Risk Level = {assessment.risk_level}, Score = {int(assessment.risk_score)}%, BMI = {round(assessment.bmi, 1) if assessment.bmi else 'N/A'}")
        
    return "\n\n".join(context_parts)


def run_openai_chat(
    user_message: str,
    history_messages: List[Dict[str, str]],
    db: Session,
    user_id: Optional[int] = None
) -> Dict[str, Any]:
    """
    Main conversational agent loop with OpenAI Tool Calling, Empathetic Persona & Memory.
    """
    client = get_openai_client()
    model_name = os.getenv("OPENAI_MODEL", OPENAI_MODEL)

    if not client:
        return {
            "reply": (
                "The OpenAI API Key is not configured on the backend server yet. "
                "Please set `OPENAI_API_KEY=your_key_here` in your environment variables or `.env` file! "
                "In the meantime, you can log your symptoms, track cycle history, and complete the risk screening assessment above."
            ),
            "tool_calls_executed": []
        }

    # Construct System Prompt enriched with user memory if available
    system_content = SYSTEM_PROMPT
    if user_id:
        memory_summary = get_user_memory_context(db, user_id)
        if memory_summary:
            system_content += f"\n\nAUTHENTICATED USER HEALTH & JOURNAL MEMORY CONTEXT:\n{memory_summary}"

    messages: List[Dict[str, Any]] = [
        {"role": "system", "content": system_content}
    ]

    # Append past conversation history with role normalization
    for msg in history_messages[-10:]:
        raw_role = (msg.get("role") or msg.get("sender") or "user").lower()
        role = "assistant" if raw_role in ["assistant", "bot", "model", "ai"] else "user"
        content = msg.get("content") or msg.get("text") or ""
        if content:
            messages.append({"role": role, "content": content})

    # Append current user prompt
    messages.append({"role": "user", "content": user_message})

    executed_tools = []

    try:
        # Initial call to OpenAI Chat Completion with tools
        response = client.chat.completions.create(
            model=model_name,
            messages=messages,
            tools=OPENAI_TOOLS,
            tool_choice="auto",
            temperature=0.7,
            max_tokens=800
        )

        response_message = response.choices[0].message
        tool_calls = response_message.tool_calls

        # Process tool calls requested by the model
        if tool_calls:
            messages.append(response_message)

            for tool_call in tool_calls:
                function_name = tool_call.function.name
                function_args = tool_call.function.arguments
                logger.info(f"Executing tool call: {function_name} with args: {function_args}")

                tool_result = dispatch_tool_call(
                    tool_name=function_name,
                    arguments_json=function_args,
                    db=db,
                    user_id=user_id
                )

                executed_tools.append({
                    "name": function_name,
                    "args": function_args,
                    "result_summary": tool_result[:120]
                })

                messages.append({
                    "tool_call_id": tool_call.id,
                    "role": "tool",
                    "name": function_name,
                    "content": tool_result
                })

            # Follow-up completion call after tool execution
            second_response = client.chat.completions.create(
                model=model_name,
                messages=messages,
                temperature=0.7,
                max_tokens=800
            )

            final_text = second_response.choices[0].message.content or "I have processed your request."
            return {
                "reply": final_text,
                "tool_calls_executed": executed_tools
            }

        else:
            final_text = response_message.content or "I am here to support your PCOS health journey. How can I help today?"
            return {
                "reply": final_text,
                "tool_calls_executed": []
            }

    except AuthenticationError:
        logger.error("OpenAI AuthenticationError: Invalid API Key.")
        return {
            "reply": "The OpenAI API key configured on the server is invalid or expired. Please check your OPENAI_API_KEY environment variable.",
            "tool_calls_executed": []
        }
    except OpenAIError as e:
        logger.error(f"OpenAI API Error: {str(e)}")
        return {
            "reply": f"I encountered a temporary connection issue with the AI engine ({str(e)}). Please try asking again in a moment.",
            "tool_calls_executed": []
        }
    except Exception as e:
        logger.error(f"Unexpected Error in OpenAI service: {str(e)}")
        return {
            "reply": f"An error occurred while processing your message: {str(e)}",
            "tool_calls_executed": []
        }
