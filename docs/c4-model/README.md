# C4 Model Architecture Diagrams

This directory contains C4 Model architecture diagrams for AISTRALE.

## C4 Model Overview

The C4 model is a way to visualize software architecture using four levels of abstraction:

1. **Context Diagram (Level 1)**: Shows the system in the context of its users and external systems
2. **Container Diagram (Level 2)**: Shows the high-level technical building blocks
3. **Component Diagram (Level 3)**: Shows how containers are broken down into components
4. **Code Diagram (Level 4)**: Shows how components are implemented (optional, usually not needed)

## Diagrams

- `01-context-diagram.md` - System context showing AISTRALE and its users/external systems
- `02-container-diagram.md` - Container architecture showing frontend, backend, database, etc.
- `03-component-diagram.md` - Component architecture for backend services
- `04-deployment-diagram.md` - Deployment architecture showing infrastructure

## Tools

These diagrams are written in Mermaid format and can be rendered in:
- GitHub (native support)
- VS Code with Mermaid extension
- Online at https://mermaid.live
- Documentation tools like MkDocs, Docusaurus, etc.

## Usage

To view these diagrams:
1. Open the `.md` files in a Markdown viewer that supports Mermaid
2. Or use the Mermaid Live Editor: https://mermaid.live
3. Or view on GitHub (diagrams render automatically)

