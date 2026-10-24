from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional

class BaseLLMProvider(ABC):
    name: str = "base"

    @abstractmethod
    async def get_embedding(self, text: str) -> List[float]:
        """Generate vector embedding (768 dimensions) for text."""
        pass

    @abstractmethod
    async def deduplicate_and_extract_task(
        self,
        candidate: Dict[str, Any],
        existing_issues: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Evaluate candidate (from News API or Citizen complaint) against existing issues.
        Determine if it is a UNIQUE new task or a DUPLICATE of an existing issue.
        Returns:
            {
                "is_unique": bool,
                "confidence": float,
                "matched_issue_id": Optional[int],
                "duplicate_reason": Optional[str],
                "extracted_task": {
                    "title": str,
                    "description": str,
                    "category": str,
                    "severity": str, # "Critical", "Non-critical", "High", "Medium", "Low"
                    "mandal": str,
                    "suggested_department": str,
                    "latitude": float,
                    "longitude": float,
                    "recommended_action": str
                }
            }
        """
        pass

    @abstractmethod
    async def answer_rag_query(
        self,
        query: str,
        context_docs: List[Dict[str, Any]],
        system_instructions: Optional[str] = None
    ) -> str:
        """Answer strategic district administration queries using RAG context."""
        pass
