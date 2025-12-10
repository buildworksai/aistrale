import typer
from aistrale_cli.commands import run, config

app = typer.Typer(help="Aistrale CLI Tool")

app.add_typer(run.app, name="run")
app.add_typer(config.app, name="config")

if __name__ == "__main__":
    app()
