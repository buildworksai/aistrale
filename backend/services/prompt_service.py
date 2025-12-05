from jinja2 import Template
from models.prompt import Prompt

def render_prompt(prompt: Prompt, variables: dict) -> str:
    """
    Render a prompt template with the given variables.
    
    Args:
        prompt: The Prompt model instance containing the template.
        variables: A dictionary of variables to substitute into the template.
        
    Returns:
        The rendered prompt string.
        
    Raises:
        ValueError: If variables are missing or template is invalid.
    """
    try:
        template = Template(prompt.template)
        # Check for missing variables? Jinja2 by default returns empty string for missing vars.
        # We might want strict validation based on prompt.input_variables.
        
        # Simple validation
        if prompt.input_variables:
            missing_vars = [var for var in prompt.input_variables if var not in variables]
            if missing_vars:
                raise ValueError(f"Missing variables for prompt: {', '.join(missing_vars)}")

        return template.render(**variables)
    except Exception as e:
        raise ValueError(f"Failed to render prompt: {str(e)}")
