"""
Bid Evaluation Engine — FastAPI microservice
Wraps the `bid_evaluation` Python library (MIT) to provide a REST API
for scoring and ranking vendor bids using configurable weighted criteria.

Endpoints:
  POST /evaluate          — run single-stage evaluation
  POST /evaluate/staged   — run multi-stage (Technical → Economic) evaluation
  GET  /health            — health check
"""

from __future__ import annotations

import logging
from typing import Any, Optional

import pandas as pd
import uvicorn
from bid_evaluation import Evaluator, StagedEvaluator
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

# ── Logging ───────────────────────────────────────────────────────────────────
logging.basicConfig(level=logging.INFO, format="%(asctime)s [BidEngine] %(message)s")
log = logging.getLogger(__name__)

# ── App ───────────────────────────────────────────────────────────────────────
app = FastAPI(
    title="Golden Team Bid Evaluation Engine",
    description="Scores and ranks vendor bids using configurable weighted criteria",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Pydantic models ───────────────────────────────────────────────────────────

class CriterionConfig(BaseModel):
    """Configuration for a single evaluation criterion."""
    column: str = Field(..., description="Column name in the bids data")
    type: str = Field(..., description="Criterion type: price|linear|threshold|direct|formula|custom")
    weight: float = Field(..., ge=0, le=1, description="Weight (0-1). All weights must sum to 1.0")
    higher_is_better: bool = Field(True, description="For linear: True if higher value is better")
    input_scale: int = Field(100, description="For direct: original scale (e.g. 10 means 0-10 scale)")
    formula: Optional[str] = Field(None, description="For formula type: math expression using 'value', 'min', 'max', 'mean'")
    formula_variables: Optional[dict[str, float]] = Field(None, description="Extra variables for formula")
    thresholds: Optional[list[list[float]]] = Field(
        None,
        description="For threshold type: [[lower, upper, score], ...] e.g. [[0,5,60],[5,10,80],[10,999,100]]"
    )


class BidData(BaseModel):
    """A single vendor bid with criterion values."""
    vendor: str = Field(..., description="Vendor/company name")
    values: dict[str, float] = Field(..., description="Map of criterion column → raw numeric value")


class EvaluateRequest(BaseModel):
    """Request body for single-stage evaluation."""
    bids: list[BidData] = Field(..., min_length=1, description="List of vendor bids to evaluate")
    criteria: list[CriterionConfig] = Field(..., min_length=1, description="Evaluation criteria configuration")
    normalize_weights: bool = Field(True, description="Auto-normalize weights to sum to 1.0")


class StageConfig(BaseModel):
    """Configuration for a single evaluation stage."""
    name: str = Field(..., description="Stage name (e.g. 'Technical', 'Economic')")
    criteria: list[CriterionConfig] = Field(..., min_length=1)
    filter_type: Optional[str] = Field(None, description="'score_threshold' or 'top_n'")
    threshold: Optional[float] = Field(None, description="Minimum score to pass (for score_threshold)")
    top_n: Optional[int] = Field(None, description="Keep only top N bids (for top_n)")
    weight: float = Field(1.0, description="Stage weight in final combined score")


class StagedEvaluateRequest(BaseModel):
    """Request body for multi-stage evaluation."""
    bids: list[BidData] = Field(..., min_length=1)
    stages: list[StageConfig] = Field(..., min_length=1)
    normalize_weights: bool = Field(True)


class CriterionResult(BaseModel):
    vendor: str
    column: str
    raw_value: Optional[float]
    computed_score: Optional[float]


class VendorResult(BaseModel):
    vendor: str
    ranking: int
    final_score: float
    criterion_scores: dict[str, Optional[float]]
    eliminated_at_stage: Optional[str] = None


class EvaluateResponse(BaseModel):
    success: bool
    ranked_results: list[VendorResult]
    summary: dict[str, Any]


# ── Helpers ───────────────────────────────────────────────────────────────────

def _build_evaluator(criteria: list[CriterionConfig], normalize: bool) -> Evaluator:
    """Construct an Evaluator from criterion configs."""
    ev = Evaluator(normalize_weights=normalize)
    for c in criteria:
        if c.type == "price":
            ev.min_ratio(c.column, weight=c.weight)
        elif c.type == "linear":
            ev.linear(c.column, weight=c.weight, higher_is_better=c.higher_is_better)
        elif c.type == "threshold":
            if not c.thresholds:
                raise HTTPException(status_code=422, detail=f"Criterion '{c.column}' of type 'threshold' requires 'thresholds'")
            thresholds = [tuple(t) for t in c.thresholds]
            ev.threshold(c.column, weight=c.weight, thresholds=thresholds)
        elif c.type == "direct":
            ev.direct(c.column, weight=c.weight, input_scale=c.input_scale)
        elif c.type == "formula":
            if not c.formula:
                raise HTTPException(status_code=422, detail=f"Criterion '{c.column}' of type 'formula' requires 'formula'")
            ev.formula(
                c.column,
                weight=c.weight,
                formula=c.formula,
                variables=c.formula_variables or {},
            )
        else:
            raise HTTPException(status_code=422, detail=f"Unknown criterion type: {c.type}")
    return ev


def _bids_to_df(bids: list[BidData]) -> pd.DataFrame:
    """Convert bid list to a DataFrame with a 'vendor' column."""
    rows = [{"vendor": b.vendor, **b.values} for b in bids]
    return pd.DataFrame(rows)


def _df_to_results(df: pd.DataFrame, criteria: list[CriterionConfig]) -> list[VendorResult]:
    """Convert result DataFrame to VendorResult list."""
    results = []
    for _, row in df.iterrows():
        criterion_scores: dict[str, Optional[float]] = {}
        for c in criteria:
            # bid_evaluation library uses 'score_{column}' prefix
            score_col = f"score_{c.column}"
            if score_col in df.columns:
                val = row.get(score_col)
                criterion_scores[c.column] = round(float(val), 2) if pd.notna(val) else None
            else:
                criterion_scores[c.column] = None

        eliminated = row.get("eliminated_at_stage", None)
        results.append(VendorResult(
            vendor=str(row["vendor"]),
            ranking=int(row.get("ranking", 999)) if pd.notna(row.get("ranking", None)) else 999,
            final_score=float(row.get("final_score", 0)) if pd.notna(row.get("final_score", None)) else 0.0,
            criterion_scores=criterion_scores,
            eliminated_at_stage=str(eliminated) if pd.notna(eliminated) and eliminated is not None else None,
        ))
    return sorted(results, key=lambda r: r.ranking)


# ── Routes ────────────────────────────────────────────────────────────────────

@app.get("/health")
def health():
    return {"status": "ok", "service": "bid-evaluation-engine", "version": "1.0.0"}


@app.post("/evaluate", response_model=EvaluateResponse)
def evaluate(req: EvaluateRequest):
    """
    Run a single-stage bid evaluation.
    Returns ranked vendors with per-criterion scores and a final weighted score.
    """
    log.info("Evaluate request: %d bids, %d criteria", len(req.bids), len(req.criteria))

    try:
        df = _bids_to_df(req.bids)
        ev = _build_evaluator(req.criteria, req.normalize_weights)
        result_df = ev.evaluate(df)
    except Exception as exc:
        log.error("Evaluation failed: %s", exc)
        raise HTTPException(status_code=500, detail=f"Evaluation engine error: {str(exc)}")

    ranked = _df_to_results(result_df, req.criteria)

    summary = {
        "total_bids": len(req.bids),
        "criteria_count": len(req.criteria),
        "winner": ranked[0].vendor if ranked else None,
        "winner_score": ranked[0].final_score if ranked else None,
        "score_spread": round(ranked[0].final_score - ranked[-1].final_score, 2) if len(ranked) > 1 else 0,
    }

    return EvaluateResponse(success=True, ranked_results=ranked, summary=summary)


@app.post("/evaluate/staged", response_model=EvaluateResponse)
def evaluate_staged(req: StagedEvaluateRequest):
    """
    Run a multi-stage bid evaluation (e.g. Technical → Economic).
    Bids that fail the technical threshold are eliminated before economic scoring.
    """
    log.info("Staged evaluate: %d bids, %d stages", len(req.bids), len(req.stages))

    try:
        df = _bids_to_df(req.bids)
        sev = StagedEvaluator(normalize_weights=req.normalize_weights)

        for stage in req.stages:
            kwargs: dict[str, Any] = {}
            if stage.filter_type:
                kwargs["filter_type"] = stage.filter_type
            if stage.threshold is not None:
                kwargs["threshold"] = stage.threshold
            if stage.top_n is not None:
                kwargs["top_n"] = stage.top_n

            sev.add_stage(stage.name, **kwargs)
            for c in stage.criteria:
                if c.type == "price":
                    sev.min_ratio(c.column, weight=c.weight)
                elif c.type == "linear":
                    sev.linear(c.column, weight=c.weight, higher_is_better=c.higher_is_better)
                elif c.type == "threshold":
                    if not c.thresholds:
                        raise HTTPException(status_code=422, detail=f"Criterion '{c.column}' requires 'thresholds'")
                    sev.threshold(c.column, weight=c.weight, thresholds=[tuple(t) for t in c.thresholds])
                elif c.type == "direct":
                    sev.direct(c.column, weight=c.weight, input_scale=c.input_scale)
                elif c.type == "formula":
                    if not c.formula:
                        raise HTTPException(status_code=422, detail=f"Criterion '{c.column}' requires 'formula'")
                    sev.formula(c.column, weight=c.weight, formula=c.formula, variables=c.formula_variables or {})

        result_df = sev.evaluate(df)
    except HTTPException:
        raise
    except Exception as exc:
        log.error("Staged evaluation failed: %s", exc)
        raise HTTPException(status_code=500, detail=f"Staged evaluation engine error: {str(exc)}")

    # Collect all criteria across all stages for result mapping
    all_criteria = [c for stage in req.stages for c in stage.criteria]
    ranked = _df_to_results(result_df, all_criteria)

    active = [r for r in ranked if r.eliminated_at_stage is None]
    eliminated = [r for r in ranked if r.eliminated_at_stage is not None]

    summary = {
        "total_bids": len(req.bids),
        "stages": len(req.stages),
        "active_bids": len(active),
        "eliminated_bids": len(eliminated),
        "winner": active[0].vendor if active else None,
        "winner_score": active[0].final_score if active else None,
    }

    return EvaluateResponse(success=True, ranked_results=ranked, summary=summary)


# ── Entry point ───────────────────────────────────────────────────────────────
if __name__ == "__main__":
    import os
    port = int(os.environ.get("BID_ENGINE_PORT", "8001"))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=False)
