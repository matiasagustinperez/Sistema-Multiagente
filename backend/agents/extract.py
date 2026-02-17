import os
import sys
from typing import List, Dict, Any
from docx import Document

# Add parent directory to path to import from app module
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import models
from app.database import SessionLocal
from app import docx_import

def process_file(file_path: str, proposal_id: int):
    """Process uploaded DOCX file and extract content (practicals, etc.)"""
    try:
        # Check if file exists
        if not os.path.exists(file_path):
            print(f"File not found: {file_path}")
            return {"status": "error", "message": "File not found"}
        
        # Load DOCX document
        doc = Document(file_path)
        
        # Extract practicals
        practicals = docx_import.extract_practicals_from_docx(doc)
        
        # Update proposal with extracted practicals
        db = SessionLocal()
        try:
            proposal = db.query(models.Proposal).filter(
                models.Proposal.id == proposal_id
            ).first()
            
            if proposal:
                # Store practicals directly (JSON column handles serialization)
                proposal.practicals = practicals  # Pass list directly, not json.dumps()
                db.commit()
                print(f"✓ Updated proposal {proposal_id} with {len(practicals)} practicals")
                return {
                    "status": "processed",
                    "proposal_id": proposal_id,
                    "practicals_extracted": len(practicals)
                }
            else:
                print(f"Proposal {proposal_id} not found")
                return {"status": "error", "message": f"Proposal {proposal_id} not found"}
        finally:
            db.close()
            
    except Exception as e:
        print(f"Error processing file {file_path}: {e}")
        import traceback
        traceback.print_exc()
        return {"status": "error", "message": str(e)}

def query_local(query: str, top_k: int = 5) -> List[Dict[str, Any]]:
    """Query local knowledge base"""
    # Placeholder for local query
    return []
