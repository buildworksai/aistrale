import typer
from aistrale.client import Aistrale

app = typer.Typer(help="Execute inference tasks")

@app.command("chat")
def chat(prompt: str, model: str = "gpt-3.5-turbo", provider: str = "openai"):
    """
    Run a chat completion.
    """
    client = Aistrale()
    typer.echo(f"Running inference with {provider}/{model}...")
    
    # Simple sync run
    try:
        result = client.run(prompt, model=model, provider=provider)
        content = result["choices"][0]["message"]["content"]
        typer.echo("\nResponse:")
        typer.echo(content)
    except Exception as e:
        typer.echo(f"Error: {e}", err=True)

@app.command("list-prompts")
def list_prompts():
    """
    List available prompts (simulated).
    """
    typer.echo("1. Customer Support Bot")
    typer.echo("2. Code Reviewer")
