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
    """Initialize OpenAI client if a valid API key is present."""
    api_key = (os.getenv("OPENAI_API_KEY") or OPENAI_API_KEY or "").strip()
    if not api_key or api_key in ["your_openai_api_key_here", "your_key_here"]:
        return None
    try:
        return OpenAI(api_key=api_key)
    except Exception:
        return None


def get_fallback_chat_response(
    user_message: str,
    history_messages: List[Dict[str, str]],
    db: Session,
    user_id: Optional[int] = None
) -> Dict[str, Any]:
    """
    Empathetic, context-aware fallback assistant when external LLM API key is not configured.
    Dispatches tool calls and answers PCOS/PCOD questions gracefully.
    """
    msg = user_message.lower().strip()
    executed_tools = []
    
    # 1. Period / Cycle History Queries
    if any(k in msg for k in ["period", "cycle", "menstrual", "tracked", "flow"]):
        if any(k in msg for k in ["history", "log", "past", "track", "my", "view", "show", "get"]):
            tool_res = dispatch_tool_call("get_period_history", json.dumps({"limit": 5}), db, user_id)
            executed_tools.append({"name": "get_period_history", "args": "{}", "result_summary": tool_res[:120]})
            try:
                data = json.loads(tool_res)
                if data.get("status") == "success":
                    records = data.get("cycle_records", [])
                    lines = [f"• Start: {r['start_date']} | Duration: {r['duration_days']} days | Notes: {r['notes']}" for r in records]
                    reply = "Here is your recent logged period history:\n\n" + "\n".join(lines) + "\n\nTracking your cycle regularly helps monitor PCOS symptoms and pattern regularity! ❤️"
                elif data.get("status") == "guest":
                    reply = "I couldn't find signed-in period logs. Please sign in to save and sync your period history across devices! In the meantime, you can log new cycles in the **Cycle Tracker** tab. 🌸"
                else:
                    reply = "You haven't logged any period entries yet. You can easily add your first entry under the **Cycle Tracker** tab! 🌸"
            except Exception:
                reply = "You can log and track your menstrual cycles under the **Cycle Tracker** tab! 🌸"
            return {"reply": reply, "tool_calls_executed": executed_tools}

    # 2. Assessment & Screening Queries
    if any(k in msg for k in ["assessment", "score", "risk", "screening", "my result", "shap", "factor"]):
        tool_res = dispatch_tool_call("get_latest_assessment", json.dumps({}), db, user_id)
        executed_tools.append({"name": "get_latest_assessment", "args": "{}", "result_summary": tool_res[:120]})
        try:
            data = json.loads(tool_res)
            if data.get("status") == "success":
                symptoms_str = ", ".join(data.get('active_symptoms', [])) if data.get('active_symptoms') else 'None recorded'
                reply = (
                    f"Based on your latest screening assessment on {data.get('date')}:\n"
                    f"• **Risk Score:** {data.get('risk_score_percent')}%\n"
                    f"• **Risk Level:** {data.get('risk_level')}\n"
                    f"• **BMI:** {data.get('bmi') or 'N/A'}\n"
                    f"• **Active Symptoms:** {symptoms_str}\n\n"
                    "You can download your complete PDF report from the **Analysis** tab to share with your gynecologist! ❤️"
                )
            else:
                reply = "You haven't completed a screening assessment yet! Head over to the **Assessment** tab to calculate your personalized PCOS risk score. 📋"
        except Exception:
            reply = "You can view your assessment details and download your PDF report in the **Analysis** tab! 📋"
        return {"reply": reply, "tool_calls_executed": executed_tools}

    # 3. Hospital & Clinic Locator Queries
    if any(k in msg for k in ["hospital", "clinic", "doctor", "gynecologist", "endocrinologist", "near me", "specialist"]):
        tool_res = dispatch_tool_call("get_hospital_recommendations", json.dumps({"state": "Karnataka"}), db, user_id)
        executed_tools.append({"name": "get_hospital_recommendations", "args": "state=Karnataka", "result_summary": tool_res[:120]})
        reply = (
            "Here are some top specialized PCOS clinics and hospitals:\n\n"
            "• **Manipal Hospital** (Gynecology & Endocrinology) - Bengaluru, Karnataka\n"
            "• **Apollo Women's Hospital** - Chennai, Tamil Nadu\n"
            "• **KEM Hospital & Research Centre** - Mumbai, Maharashtra\n\n"
            "You can browse by State and District in the **Hospitals** tab to find doctors near you! 🏥"
        )
        return {"reply": reply, "tool_calls_executed": executed_tools}

    # 4. PCOS Symptoms Information
    if any(k in msg for k in ["symptom", "sign", "cause", "why", "happen", "acne", "hair"]):
        reply = (
            "PCOS (Polycystic Ovary Syndrome) symptoms can include:\n"
            "1. **Irregular or Missed Periods:** Caused by hormonal imbalance preventing regular ovulation.\n"
            "2. **Excess Androgens:** Higher male hormone levels leading to facial hair growth (hirsutism) or acne.\n"
            "3. **Metabolic Changes:** Insulin resistance, weight gain, or difficulty losing weight.\n"
            "4. **Hair Thinning:** Scalp hair thinning or male-pattern hair loss.\n\n"
            "Are you experiencing any of these symptoms? You can log them in the **Assessment** tab to get an AI risk evaluation! ❤️"
        )
        return {"reply": reply, "tool_calls_executed": []}

    # 5. Diet & Nutrition
    if any(k in msg for k in ["diet", "food", "eat", "nutrition", "sugar", "meal"]):
        reply = (
            "A PCOS-friendly diet focuses on managing insulin sensitivity and reducing inflammation:\n"
            "• **Low Glycemic Index (GI) Foods:** Complex carbs like oats, quinoa, brown rice, and lentils.\n"
            "• **High Fiber & Protein:** Leafy greens, seeds (flax, chia), nuts, and lean proteins.\n"
            "• **Limit Refined Sugars:** Avoid sugary drinks, white bread, and ultra-processed snacks.\n"
            "• **Healthy Fats:** Extra virgin olive oil, avocados, and omega-3 rich foods.\n\n"
            "Eating balanced, low-GI meals helps stabilize energy and hormone levels throughout the day! 🥗"
        )
        return {"reply": reply, "tool_calls_executed": []}

    # 6. Exercise & Lifestyle
    if any(k in msg for k in ["exercise", "workout", "activity", "weight", "walk", "gym"]):
        reply = (
            "Regular physical movement is wonderful for PCOS management! 🏃‍♀️\n"
            "• **Cardio & Strength Training:** 30 minutes of moderate activity (brisk walking, cycling, or resistance training) 4–5 days a week.\n"
            "• **Insulin Sensitivity:** Muscle movement helps your cells use glucose effectively.\n"
            "• **Stress Reduction:** Gentle yoga or pilates helps lower cortisol levels."
        )
        return {"reply": reply, "tool_calls_executed": []}

    # 7. Greetings
    if any(k in msg for k in ["hello", "hi", "hey", "greetings"]):
        reply = (
            "Hello! ❤️ Welcome to your PCOS Health Companion. "
            "I'm here to answer questions about PCOS symptoms, diet recommendations, cycle tracking, or your screening results. "
            "How can I support you today?"
        )
        return {"reply": reply, "tool_calls_executed": []}

    # Default friendly fallback response
    reply = (
        "Thank you for reaching out! ❤️ PCOS (Polycystic Ovary Syndrome) is a very common hormonal condition that affects 1 in 5 women. "
        "You can complete the **Assessment** tab for an ML-backed risk screening, track your periods in the **Cycle Tracker**, "
        "or explore specialized doctors in the **Hospitals** tab.\n\n"
        "Feel free to ask me anything about PCOS symptoms, lifestyle tips, or how to interpret your assessment results!"
    )
    return {"reply": reply, "tool_calls_executed": []}


def run_openai_chat(
    user_message: str,
    history_messages: List[Dict[str, str]],
    db: Session,
    user_id: Optional[int] = None
) -> Dict[str, Any]:
    """
    Main conversational agent loop with OpenAI Tool Calling, Empathetic Persona & Memory.
    Falls back to intelligent companion mode if no external LLM API key is present.
    """
    client = get_openai_client()
    model_name = os.getenv("OPENAI_MODEL", OPENAI_MODEL)

    if not client:
        return get_fallback_chat_response(user_message, history_messages, db, user_id)

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
        logger.error("OpenAI AuthenticationError: Invalid API Key. Falling back to intelligent companion.")
        return get_fallback_chat_response(user_message, history_messages, db, user_id)
    except OpenAIError as e:
        logger.error(f"OpenAI API Error: {str(e)}. Falling back to intelligent companion.")
        return get_fallback_chat_response(user_message, history_messages, db, user_id)
    except Exception as e:
        logger.error(f"Unexpected Error in OpenAI service: {str(e)}. Falling back to intelligent companion.")
        return get_fallback_chat_response(user_message, history_messages, db, user_id)
