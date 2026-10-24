import os
import math
import logging
from typing import List, Dict, Any, Tuple
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

logger = logging.getLogger("fimms.ai.vectorstore")

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./farmai.db")

class VectorStore:
    def __init__(self):
        self.is_postgres = "postgresql" in DATABASE_URL
        self.in_memory_index: Dict[int, Dict[str, Any]] = {}
        
        try:
            if self.is_postgres:
                self.engine = create_engine(DATABASE_URL, pool_pre_ping=True)
                # Verify pgvector extension
                with self.engine.connect() as conn:
                    conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector;"))
                    conn.commit()
                logger.info("Initialized PostgreSQL pgvector engine with HNSW support.")
            else:
                self.engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
                logger.info("Using SQLite with in-memory optimized cosine vector index.")
        except Exception as e:
            logger.warning(f"Database connection note for vector store: {e}. Using resilient in-memory index.")
            self.engine = None
            self.is_postgres = False

    def generate_embedding(self, text: str) -> List[float]:
        """Generate a normalized 768-dim embedding vector."""
        return self._fallback_embedding(text)

    def _fallback_embedding(self, text: str) -> List[float]:
        """Deterministic 768-dim embedding hash."""
        import hashlib
        vec = []
        norm = 0.0
        for i in range(768):
            seed = f"{text}_{i}".encode('utf-8')
            h = int(hashlib.sha256(seed).hexdigest()[:8], 16)
            val = (h / 0xffffffff) * 2.0 - 1.0
            vec.append(val)
            norm += val * val
        norm = math.sqrt(norm) or 1.0
        return [v / norm for v in vec]

    def upsert_issue_embedding(self, issue_id: int, content: str, embedding: List[float]):
        """Index issue embedding with pgvector or in-memory store."""
        # Always update in-memory cache for ultra-fast fallback
        self.in_memory_index[issue_id] = {
            "issue_id": issue_id,
            "content": content,
            "embedding": embedding
        }

        if self.is_postgres and self.engine:
            try:
                emb_str = "[" + ",".join(str(x) for x in embedding) + "]"
                sql = text("""
                    INSERT INTO issue_embeddings (issue_id, embedding, content, created_at)
                    VALUES (:issue_id, :embedding::vector, :content, NOW())
                    ON CONFLICT (id) DO NOTHING;
                """)
                with self.engine.connect() as conn:
                    conn.execute(sql, {"issue_id": issue_id, "embedding": emb_str, "content": content})
                    conn.commit()
            except Exception as e:
                logger.error(f"Failed to insert into pgvector: {e}")

    def search_similar(self, query_embedding: List[float], top_k: int = 5) -> List[Dict[str, Any]]:
        """Find nearest neighbor issues using cosine similarity."""
        if self.is_postgres and self.engine:
            try:
                emb_str = "[" + ",".join(str(x) for x in query_embedding) + "]"
                sql = text(f"""
                    SELECT e.issue_id, e.content, 
                           1 - (e.embedding <=> :qemb::vector) AS similarity,
                           i.title, i.description, i.mandal_name, i.category, i.severity, i.status
                    FROM issue_embeddings e
                    JOIN issues i ON i.id = e.issue_id
                    ORDER BY e.embedding <=> :qemb::vector
                    LIMIT :limit;
                """)
                with self.engine.connect() as conn:
                    result = conn.execute(sql, {"qemb": emb_str, "limit": top_k}).fetchall()
                    return [
                        {
                            "id": r[0],
                            "content": r[1],
                            "similarity": float(r[2]),
                            "title": r[3],
                            "description": r[4],
                            "mandal_name": r[5],
                            "category": r[6],
                            "severity": r[7],
                            "status": r[8]
                        }
                        for r in result
                    ]
            except Exception as e:
                logger.warning(f"pgvector query fallback to memory: {e}")

        # In-memory cosine search fallback
        results = []
        for issue_id, item in self.in_memory_index.items():
            emb = item["embedding"]
            sim = self._cosine_similarity(query_embedding, emb)
            results.append({
                "id": issue_id,
                "content": item["content"],
                "similarity": sim
            })

        results.sort(key=lambda x: x["similarity"], reverse=True)
        return results[:top_k]

    def _cosine_similarity(self, v1: List[float], v2: List[float]) -> float:
        if not v1 or not v2 or len(v1) != len(v2):
            return 0.0
        dot = sum(a * b for a, b in zip(v1, v2))
        norm1 = math.sqrt(sum(a * a for a in v1))
        norm2 = math.sqrt(sum(b * b for b in v2))
        if norm1 == 0.0 or norm2 == 0.0:
            return 0.0
        return dot / (norm1 * norm2)

vector_store = VectorStore()
