try:
    from huggingface_hub import AsyncInferenceClient
    print("AsyncInferenceClient found")
except ImportError:
    print("AsyncInferenceClient NOT found")
