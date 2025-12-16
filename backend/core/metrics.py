from prometheus_client import Counter, Histogram

INFERENCE_COUNT = Counter(
    "llm_requests_total",
    "Total LLM inference requests",
    ["provider", "model", "status"],
)

INFERENCE_DURATION = Histogram(
    "llm_latency_seconds", "LLM inference latency", ["provider", "model"]
)

INFERENCE_TOKENS = Histogram(
    "llm_tokens_total",
    "Total tokens used",
    ["provider", "model", "type"],  # type: input, output
)

INFERENCE_COST = Histogram(
    "llm_cost_usd", "LLM cost in USD", [
        "provider", "model"])
