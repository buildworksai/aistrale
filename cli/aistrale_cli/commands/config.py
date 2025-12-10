import typer
import os
import json

app = typer.Typer(help="Manage configuration")

CONFIG_FILE = os.path.expanduser("~/.aistrale/config.json")

@app.command("set")
def set_config(key: str, value: str):
    """
    Set a configuration value.
    """
    config = {}
    if os.path.exists(CONFIG_FILE):
        try:
            with open(CONFIG_FILE, "r") as f:
                config = json.load(f)
        except:
             pass
    
    config[key] = value
    
    os.makedirs(os.path.dirname(CONFIG_FILE), exist_ok=True)
    with open(CONFIG_FILE, "w") as f:
        json.dump(config, f, indent=2)
    
    typer.echo(f"Set {key} = {value}")

@app.command("show")
def show_config():
    """
    Show current configuration.
    """
    if os.path.exists(CONFIG_FILE):
        with open(CONFIG_FILE, "r") as f:
            typer.echo(f.read())
    else:
        typer.echo("No configuration found.")
