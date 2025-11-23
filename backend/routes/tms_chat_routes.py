from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import List, Optional
from models import User
from auth import get_current_user
from database import db
from datetime import datetime, timezone
import uuid
import os
import asyncio

router = APIRouter(prefix="/tms-chat", tags=["TMS Chat"])

class ChatMessage(BaseModel):
    role: str  # 'user' or 'assistant'
    content: str
    timestamp: Optional[str] = None

class ChatRequest(BaseModel):
    message: str
    context: Optional[str] = "general"  # dispatch, accounting, sales, hr, maintenance, safety

CONTEXT_SYSTEM_MESSAGES = {
    "dispatch": """You are a TMS Dispatch Operations AI Assistant. Help with:
- Route planning and optimization
- Load assignment and scheduling
- Driver dispatch and coordination
- Real-time tracking and updates
- Delivery status monitoring
Provide concise, actionable advice for dispatch operations.""",
    
    "accounting": """You are a TMS Accounting AI Assistant. Help with:
- Invoice generation and management
- Payment tracking and reconciliation
- Financial reporting
- Cost analysis and budgeting
- Expense management
Provide accurate financial guidance for transportation operations.""",
    
    "sales": """You are a TMS Sales & Business Development AI Assistant. Help with:
- Lead generation strategies
- Customer relationship management
- Rate quotes and negotiations
- Market analysis
- Business growth opportunities
Provide strategic sales and business development advice.""",
    
    "hr": """You are a TMS Human Resources AI Assistant. Help with:
- Driver recruitment and onboarding
- Employee management
- Training and compliance
- Performance evaluation
- Payroll and benefits
Provide HR guidance for transportation workforce management.""",
    
    "maintenance": """You are a TMS Fleet Maintenance AI Assistant. Help with:
- Preventive maintenance scheduling
- Vehicle inspection and repairs
- Maintenance cost tracking
- Equipment lifecycle management
- Breakdown prevention
Provide technical guidance for fleet maintenance operations.""",
    
    "safety": """You are a TMS Fleet Safety AI Assistant. Help with:
- Safety compliance (FMCSA, DOT)
- Accident prevention and investigation
- Driver safety training
- Vehicle safety inspections
- Safety metrics and reporting
Provide safety-focused guidance for transportation operations.""",
    
    "general": """You are a comprehensive TMS (Transportation Management System) AI Assistant. 
You help with dispatch operations, accounting, sales, HR, fleet maintenance, and safety.
Provide helpful, accurate, and actionable advice for transportation and logistics operations."""
}

@router.post("/message")
async def send_chat_message(
    chat_request: ChatRequest,
    current_user: User = Depends(get_current_user)
):
    """Send a message and get AI response"""
    try:
        # Lazy import to avoid issues if not installed
        from emergentintegrations.llm.chat import LlmChat, UserMessage
        
        # Get or create session ID for this user
        session_id = f"tms-chat-{current_user.id}"
        
        # Get context-specific system message
        system_message = CONTEXT_SYSTEM_MESSAGES.get(
            chat_request.context, 
            CONTEXT_SYSTEM_MESSAGES["general"]
        )
        
        # Get API key from environment
        api_key = os.environ.get('EMERGENT_LLM_KEY', 'sk-emergent-73b04E1E4779758EfC')
        
        # Initialize chat with GPT-5 Nano
        chat = LlmChat(
            api_key=api_key,
            session_id=session_id,
            system_message=system_message
        ).with_model("openai", "gpt-5-nano")
        
        # Create user message
        user_message = UserMessage(text=chat_request.message)
        
        # Get response
        response = await chat.send_message(user_message)
        
        # Save to database
        chat_history_entry = {
            "id": str(uuid.uuid4()),
            "user_id": current_user.id,
            "session_id": session_id,
            "context": chat_request.context,
            "user_message": chat_request.message,
            "assistant_response": response,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        
        await db.tms_chat_history.insert_one(chat_history_entry)
        
        return {
            "success": True,
            "response": response,
            "context": chat_request.context
        }
        
    except ImportError:
        raise HTTPException(
            status_code=500, 
            detail="emergentintegrations library not installed. Please install with: pip install emergentintegrations --extra-index-url https://d33sy5i8bnduwe.cloudfront.net/simple/"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Chat error: {str(e)}")

@router.get("/history")
async def get_chat_history(
    context: Optional[str] = None,
    limit: int = 50,
    current_user: User = Depends(get_current_user)
):
    """Get chat history for current user"""
    try:
        query = {"user_id": current_user.id}
        if context:
            query["context"] = context
        
        history = await db.tms_chat_history.find(
            query,
            {"_id": 0}
        ).sort("timestamp", -1).limit(limit).to_list(length=limit)
        
        return {
            "success": True,
            "history": history
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching history: {str(e)}")

@router.delete("/history")
async def clear_chat_history(
    context: Optional[str] = None,
    current_user: User = Depends(get_current_user)
):
    """Clear chat history for current user"""
    try:
        query = {"user_id": current_user.id}
        if context:
            query["context"] = context
        
        result = await db.tms_chat_history.delete_many(query)
        
        return {
            "success": True,
            "deleted_count": result.deleted_count
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error clearing history: {str(e)}")
