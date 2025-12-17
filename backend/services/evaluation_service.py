import csv
import json

from sqlmodel import Session, select

from models.evaluation import Evaluation, EvaluationResult
from models.prompt import Prompt
from models.token import Token
from services import inference_service


class EvaluationService:
    def __init__(self, session: Session):
        self.session = session

    def load_dataset(self, file_path: str) -> list[dict[str, str]]:
        """
        Load dataset from a JSON or CSV file.
        Expected format: List of dicts with 'input' and 'expected' keys.
        """
        dataset = []
        try:
            if file_path.endswith(".json"):
                with open(file_path) as f:
                    data = json.load(f)
                    if isinstance(data, list):
                        dataset = data
                    else:
                        raise ValueError(
                            "JSON dataset must be a list of objects")
            elif file_path.endswith(".csv"):
                with open(file_path) as f:
                    reader = csv.DictReader(f)
                    dataset = list(reader)
            else:
                raise ValueError("Unsupported file format. Use .json or .csv")

            # Validate dataset
            for item in dataset:
                if "input" not in item or "expected" not in item:
                    raise ValueError(
                        "Dataset items must contain 'input' and 'expected' keys"
                    )

            return dataset
        except Exception as e:
            raise ValueError(f"Failed to load dataset: {e!s}") from e

    async def run_evaluation(self, evaluation_id: int):
        evaluation = self.session.get(Evaluation, evaluation_id)
        if not evaluation:
            raise ValueError("Evaluation not found")

        evaluation.status = "running"
        self.session.add(evaluation)
        self.session.commit()

        try:
            # Load dataset
            if not evaluation.dataset_path:
                # Fallback to mock for backward compatibility or testing if
                # path is missing
                dataset = [
                    {"input": "Hello", "expected": "Hi there"},
                    {"input": "Bye", "expected": "Goodbye"},
                ]
            else:
                dataset = self.load_dataset(evaluation.dataset_path)

            prompt = self.session.get(Prompt, evaluation.prompt_id)
            if not prompt:
                raise ValueError("Prompt not found")

            # Get user token
            # Try to find default token first
            token = self.session.exec(
                select(Token).where(
                    Token.user_id == evaluation.user_id, Token.is_default
                )
            ).first()

            if not token:
                # Fallback to any token
                token = self.session.exec(
                    select(Token).where(Token.user_id == evaluation.user_id)
                ).first()

            if not token:
                raise ValueError("No API token found for user")

            results = []
            for item in dataset:
                # Run inference
                # We need to determine provider from token or prompt?
                # Token has provider.

                # Use token.token_value (which decrypts it)
                token_val = token.token_value

                output = await inference_service.run_inference(
                    session=self.session,
                    user_id=evaluation.user_id,
                    provider=token.provider,
                    model=prompt.model or "gpt-3.5-turbo",  # Fallback model
                    input_text=item["input"],
                    token_value=token_val,
                    prompt_id=prompt.id,
                    # Prompt variables support can be added when prompts require more
                    # than just 'input'.
                    # For now assuming 'input' maps to the main input
                )

                # If output is a dict (e.g. image), we need to handle it.
                # Evaluation usually expects text.
                if isinstance(output, dict):
                    output_text = str(output)
                else:
                    output_text = str(output)

                # Calculate score (exact match for now)
                score = 1.0 if output_text.strip(
                ) == item["expected"].strip() else 0.0

                result = EvaluationResult(
                    evaluation_id=evaluation.id,
                    input=item["input"],
                    output=output_text,
                    score=score,
                )
                self.session.add(result)
                results.append(result)

            evaluation.status = "completed"
            self.session.add(evaluation)
            self.session.commit()

        except Exception:
            evaluation.status = "failed"
            self.session.add(evaluation)
            self.session.commit()
            raise
