import os
import json
import logging
from typing import List, Dict, Any, Optional
import boto3
from botocore.exceptions import BotoCoreError, ClientError
from .base import BaseLLMProvider

logger = logging.getLogger("fimms.ai.bedrock")

class BedrockProvider(BaseLLMProvider):
    name = "bedrock"

    def __init__(
        self,
        model_id: Optional[str] = None,
        region: Optional[str] = None,
        access_key: Optional[str] = None,
        secret_key: Optional[str] = None
    ):
        self.model_id = model_id or os.getenv("BEDROCK_MODEL_ID", "anthropic.claude-3-haiku-20240307-v1:0")
        self.region = region or os.getenv("AWS_REGION", "ap-south-1")
        self.client = None
        self._init_client(access_key, secret_key)

    def _init_client(self, access_key: Optional[str] = None, secret_key: Optional[str] = None):
        client_kwargs = {
            "service_name": "bedrock-runtime",
            "region_name": self.region,
        }
        ak = access_key or os.getenv("AWS_ACCESS_KEY_ID")
        sk = secret_key or os.getenv("AWS_SECRET_ACCESS_KEY")
        if ak and sk:
            client_kwargs["aws_access_key_id"] = ak
            client_kwargs["aws_secret_access_key"] = sk

        try:
            self.client = boto3.client(**client_kwargs)
            logger.info(f"Initialized AWS Bedrock Provider in {self.region} with {self.model_id}")
        except Exception as e:
            logger.warning(f"Bedrock client initialization warning: {e}")
            self.client = None

    @property
    def is_configured(self) -> bool:
        return self.client is not None

    async def get_embedding(self, text: str) -> List[float]:
        if not self.is_configured:
            return self._fallback_embedding(text)

        try:
            body = json.dumps({"inputText": text[:2000]})
            response = self.client.invoke_model(
                modelId="amazon.titan-embed-text-v2:0",
                contentType="application/json",
                accept="application/json",
                body=body
            )
            response_body = json.loads(response.get("body").read())
            embedding = response_body.get("embedding", [])
            if embedding:
                # Truncate or pad to 768 to maintain standard dimension across providers
                return embedding[:768] if len(embedding) >= 768 else embedding + [0.0]*(768-len(embedding))
        except Exception as e:
            logger.warning(f"Bedrock Titan embedding error: {e}")

        return self._fallback_embedding(text)

    async def deduplicate_and_extract_task(
        self,
        candidate: Dict[str, Any],
        existing_issues: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        if not self.is_configured:
            # Fall back to local semantic deduplication if Bedrock is not reachable
            from .gemini_provider import GeminiProvider
            return GeminiProvider()._local_deduplicate(candidate, existing_issues)

        existing_context = existing_issues[:8]
        prompt = f"""Human: You are the Chief AI Civic Intelligence Specialist for a District Collectorate (FIMMS System).
Analyze this incoming event and determine if it is a UNIQUE new task or a DUPLICATE of an existing issue.

CANDIDATE EVENT:
Source: {candidate.get('source_type', 'citizen_complaint')}
Title: {candidate.get('title', '')}
Description: {candidate.get('description', '')}
Mandal: {candidate.get('mandal', 'Yadadri Bhuvanagiri')}
Category: {candidate.get('category', 'Infrastructure')}

EXISTING KNOWN DISTRICT ISSUES:
{json.dumps(existing_context, indent=2)}

Return ONLY valid JSON matching this structure:
{{
    "is_unique": true | false,
    "confidence": 0.0 to 1.0,
    "matched_issue_id": integer or null,
    "duplicate_reason": "string or null",
    "extracted_task": {{
        "title": "Clear administrative task title",
        "description": "Executive summary of ground situation",
        "category": "Hostels" | "Health" | "Water & Irrigation" | "Roads & PWD" | "Education" | "Electricity" | "Agriculture",
        "severity": "Critical" | "Non-critical",
        "mandal": "Identified mandal",
        "suggested_department": "Social Welfare" | "Irrigation" | "Health & Medical" | "PWD" | "Electricity Board" | "Panchayat Raj",
        "recommended_action": "Action directive for Collectorate"
    }}
}}

Assistant:"""

        try:
            response = self.client.converse(
                modelId=self.model_id,
                messages=[{"role": "user", "content": [{"text": prompt}]}],
                inferenceConfig={"temperature": 0.1, "maxTokens": 1000}
            )
            msg = response.get("output", {}).get("message", {}).get("content", [{}])[0].get("text", "")
            # Parse json from output
            msg = msg.strip()
            if "{" in msg and "}" in msg:
                s = msg[msg.find("{"):msg.rfind("}")+1]
                return json.loads(s)
        except Exception as e:
            logger.error(f"Bedrock deduplication call failed: {e}")

        from .gemini_provider import GeminiProvider
        return GeminiProvider()._local_deduplicate(candidate, existing_issues)

    async def answer_rag_query(
        self,
        query: str,
        context_docs: List[Dict[str, Any]],
        system_instructions: Optional[str] = None
    ) -> str:
        if not self.is_configured:
            from .gemini_provider import GeminiProvider
            return GeminiProvider()._local_rag_answer(query, context_docs)

        context_str = "\n\n".join([
            f"[Record #{d.get('id', idx+1)} | Mandal: {d.get('mandal_name', '')} | Severity: {d.get('severity', '')}]\nTitle: {d.get('title')}\nDetails: {d.get('description')}"
            for idx, d in enumerate(context_docs[:10])
        ])

        system = system_instructions or "You are the Executive Intelligence Assistant to the District Collector."
        prompt = f"""Human: {system}

DISTRICT DATABASE CONTEXT:
{context_str}

COLLECTOR'S QUERY:
{query}

Assistant:"""

        try:
            response = self.client.converse(
                modelId=self.model_id,
                messages=[{"role": "user", "content": [{"text": prompt}]}],
                inferenceConfig={"temperature": 0.2, "maxTokens": 800}
            )
            return response.get("output", {}).get("message", {}).get("content", [{}])[0].get("text", "")
        except Exception as e:
            logger.error(f"Bedrock RAG query failed: {e}")

        from .gemini_provider import GeminiProvider
        return GeminiProvider()._local_rag_answer(query, context_docs)

    def _fallback_embedding(self, text: str) -> List[float]:
        from .gemini_provider import GeminiProvider
        return GeminiProvider()._fallback_embedding(text)
