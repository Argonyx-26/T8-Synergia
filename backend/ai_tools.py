import json
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from backend.database import Assessment, PeriodEntry, Hospital, User, HealthJournalEntry

# --- MCP Readiness: Modular OpenAI Tool Definitions ---

OPENAI_TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "get_period_history",
            "description": "Retrieves the authenticated user's recorded menstrual cycle history, cycle lengths, and flow durations.",
            "parameters": {
                "type": "object",
                "properties": {
                    "limit": {
                        "type": "integer",
                        "description": "Maximum number of past cycle records to return (default 5)",
                        "default": 5
                    }
                },
                "required": []
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_latest_assessment",
            "description": "Retrieves the authenticated user's most recent PCOS/PCOD machine learning screening result, risk score, BMI, symptoms, and LH/FSH ratio.",
            "parameters": {
                "type": "object",
                "properties": {},
                "required": []
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "explain_assessment",
            "description": "Explains the machine learning feature importance (SHAP drivers) for the user's latest assessment report in simple terms.",
            "parameters": {
                "type": "object",
                "properties": {},
                "required": []
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_hospital_recommendations",
            "description": "Searches specialized PCOS/PCOD gynecologists and diagnostic clinics in a specified Indian state and district/city.",
            "parameters": {
                "type": "object",
                "properties": {
                    "state": {
                        "type": "string",
                        "description": "State name in India (e.g. 'Karnataka', 'Maharashtra', 'Delhi')"
                    },
                    "district": {
                        "type": "string",
                        "description": "District or city name in India (e.g. 'Bengaluru', 'Mumbai', 'New Delhi')"
                    }
                },
                "required": ["state"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "generate_health_report",
            "description": "Generates a downloadable PDF report URL for the user's latest PCOS assessment.",
            "parameters": {
                "type": "object",
                "properties": {},
                "required": []
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_journal_history",
            "description": "Retrieves the authenticated user's saved free-text health, mood, and experience journal entries.",
            "parameters": {
                "type": "object",
                "properties": {
                    "limit": {
                        "type": "integer",
                        "description": "Maximum number of recent journal entries to return (default 5)",
                        "default": 5
                    }
                },
                "required": []
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "search_journal_entries",
            "description": "Searches the user's saved personal journal entries for specific symptoms, words, or feelings (e.g. 'anxious', 'tired', 'irregular', 'acne').",
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {
                        "type": "string",
                        "description": "Search keyword or phrase to look for in past journal entries"
                    }
                },
                "required": ["query"]
            }
        }
    }
]

# --- Tool Execution Handlers (Authorized & Scoped) ---

def execute_get_period_history(db: Session, user_id: int, limit: int = 5) -> str:
    """Retrieve logged menstrual cycle records for the authenticated user or active session."""
    query = db.query(PeriodEntry)
    if user_id:
        query = query.filter(PeriodEntry.user_id == user_id)
        
    entries = query.order_by(PeriodEntry.created_at.desc()).limit(limit).all()
    if not entries:
        return json.dumps({"status": "guest", "message": "No logged period history found. You can log new cycles under the Cycle Tracker tab!"})
        
    history = []
    for e in entries:
        history.append({
            "start_date": e.start_date,
            "end_date": e.end_date,
            "duration_days": e.duration_days,
            "notes": e.notes or "None"
        })
    return json.dumps({"status": "success", "count": len(history), "cycle_records": history})


def execute_get_latest_assessment(db: Session, user_id: int) -> str:
    """Retrieve user's latest ML screening report."""
    query = db.query(Assessment)
    if user_id:
        query = query.filter(Assessment.user_id == user_id)
        
    assessment = query.order_by(Assessment.created_at.desc()).first()
    if not assessment:
        return json.dumps({"status": "guest", "message": "User has not completed an assessment yet. Encourage them to use the interactive Assessment tab."})
        
    symptoms_list = []
    if assessment.irregular_periods: symptoms_list.append("Irregular periods")
    if assessment.no_periods: symptoms_list.append("Missed / absent periods")
    if assessment.excess_hair: symptoms_list.append("Excess facial/body hair")
    if assessment.acne: symptoms_list.append("Acne or oily skin")
    if assessment.hair_loss: symptoms_list.append("Hair thinning / loss")
    if assessment.dark_patches: symptoms_list.append("Dark skin patches")
    if assessment.weight_gain: symptoms_list.append("Weight gain")
    if assessment.difficulty_losing_weight: symptoms_list.append("Difficulty losing weight")
    if assessment.fatigue: symptoms_list.append("Fatigue")
    if assessment.mood_swings: symptoms_list.append("Mood swings")
    if assessment.pelvic_pain: symptoms_list.append("Pelvic pain")
    if assessment.infertility: symptoms_list.append("Infertility history")

    lh_fsh_ratio = round(assessment.lh / assessment.fsh, 2) if (assessment.lh and assessment.fsh and assessment.fsh > 0) else None

    return json.dumps({
        "status": "success",
        "assessment_id": assessment.id,
        "date": assessment.created_at.strftime("%Y-%m-%d"),
        "risk_score_percent": assessment.risk_score,
        "risk_level": assessment.risk_level,
        "confidence_percent": round(assessment.confidence * 100),
        "bmi": round(assessment.bmi, 1) if assessment.bmi else None,
        "lh_fsh_ratio": lh_fsh_ratio,
        "active_symptoms": symptoms_list,
        "symptom_count": len(symptoms_list)
    })


def execute_explain_assessment(db: Session, user_id: int) -> str:
    """Explain SHAP feature importance for the latest assessment."""
    if not user_id:
        return json.dumps({"status": "guest", "message": "User is unauthenticated."})
        
    assessment = db.query(Assessment).filter(Assessment.user_id == user_id).order_by(Assessment.created_at.desc()).first()
    if not assessment:
        return json.dumps({"status": "empty", "message": "No completed assessment to explain."})
        
    top_features = []
    if assessment.top_features:
        try:
            top_features = json.loads(assessment.top_features)
        except Exception:
            pass

    return json.dumps({
        "status": "success",
        "risk_score_percent": assessment.risk_score,
        "risk_level": assessment.risk_level,
        "top_contributing_factors": top_features,
        "recommendations": json.loads(assessment.recommendations) if assessment.recommendations else []
    })


def execute_get_hospital_recommendations(db: Session, state: str, district: Optional[str] = None) -> str:
    """Query hospital locator directory."""
    query = db.query(Hospital).filter(Hospital.state.ilike(f"%{state}%"))
    if district:
        query = query.filter(Hospital.district.ilike(f"%{district}%"))
    hospitals = query.limit(5).all()
    
    if not hospitals:
        return json.dumps({"status": "empty", "message": f"No specialized clinics found matching {state} {district or ''}."})
        
    results = []
    for h in hospitals:
        results.append({
            "name": h.name,
            "specialty": h.specialty,
            "district": h.district,
            "state": h.state,
            "address": h.address,
            "phone": h.phone or "N/A"
        })
    return json.dumps({"status": "success", "clinics": results})


def execute_generate_health_report(db: Session, user_id: int) -> str:
    """Generate download URL for PDF report."""
    if not user_id:
        return json.dumps({"status": "guest", "message": "Please sign in to generate a downloadable PDF report."})
        
    assessment = db.query(Assessment).filter(Assessment.user_id == user_id).order_by(Assessment.created_at.desc()).first()
    if not assessment:
        return json.dumps({"status": "empty", "message": "Please complete a health assessment screening before downloading a report."})
        
    report_url = f"/api/report/{assessment.id}"
    return json.dumps({
        "status": "success",
        "assessment_id": assessment.id,
        "report_url": report_url,
        "message": f"Your health report PDF for Assessment #{assessment.id} is ready to download at {report_url}."
    })


def execute_get_journal_history(db: Session, user_id: int, limit: int = 5) -> str:
    """Retrieve saved health journal entries for the authenticated user."""
    if not user_id:
        return json.dumps({"status": "guest", "message": "No logged journal entries found. Please sign in to view persistent journal records."})
        
    entries = db.query(HealthJournalEntry).filter(
        HealthJournalEntry.user_id == user_id,
        HealthJournalEntry.consent_for_ai == True
    ).order_by(HealthJournalEntry.created_at.desc()).limit(limit).all()
    
    if not entries:
        return json.dumps({"status": "empty", "message": "No personal journal entries logged yet for this account."})
        
    records = []
    for e in entries:
        records.append({
            "id": e.id,
            "date": e.entry_date,
            "text": e.free_text,
            "symptoms": json.loads(e.selected_symptoms) if e.selected_symptoms else [],
            "tags": json.loads(e.tags) if e.tags else [],
            "emotional_context": e.emotional_context
        })
    return json.dumps({"status": "success", "count": len(records), "journal_entries": records})


def execute_search_journal_entries(db: Session, user_id: int, query: str) -> str:
    """Search user journal entries for keyword match."""
    if not user_id:
        return json.dumps({"status": "guest", "message": "Please sign in to search your personal journal history."})
        
    if not query:
        return execute_get_journal_history(db, user_id)
        
    entries = db.query(HealthJournalEntry).filter(
        HealthJournalEntry.user_id == user_id,
        HealthJournalEntry.consent_for_ai == True,
        HealthJournalEntry.free_text.ilike(f"%{query}%")
    ).order_by(HealthJournalEntry.created_at.desc()).limit(10).all()
    
    if not entries:
        return json.dumps({"status": "empty", "message": f"No journal entries matching '{query}' were found."})
        
    records = []
    for e in entries:
        records.append({
            "id": e.id,
            "date": e.entry_date,
            "text": e.free_text,
            "emotional_context": e.emotional_context
        })
    return json.dumps({"status": "success", "query": query, "matches": records})


def dispatch_tool_call(tool_name: str, arguments_json: str, db: Session, user_id: Optional[int]) -> str:
    """Safe dispatcher executing requested tool call."""
    try:
        args = json.loads(arguments_json) if arguments_json else {}
    except Exception:
        args = {}

    if tool_name == "get_period_history":
        return execute_get_period_history(db, user_id or 0, limit=args.get("limit", 5))
    elif tool_name == "get_latest_assessment":
        return execute_get_latest_assessment(db, user_id or 0)
    elif tool_name == "explain_assessment":
        return execute_explain_assessment(db, user_id or 0)
    elif tool_name == "get_hospital_recommendations":
        return execute_get_hospital_recommendations(db, state=args.get("state", ""), district=args.get("district"))
    elif tool_name == "generate_health_report":
        return execute_generate_health_report(db, user_id or 0)
    elif tool_name == "get_journal_history":
        return execute_get_journal_history(db, user_id or 0, limit=args.get("limit", 5))
    elif tool_name == "search_journal_entries":
        return execute_search_journal_entries(db, user_id or 0, query=args.get("query", ""))
    else:
        return json.dumps({"error": f"Unknown tool name: {tool_name}"})
