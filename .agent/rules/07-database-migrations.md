---
trigger: always_on
description: Database migration standards using Alembic for AISTRALE
globs: backend/alembic/**/*.py, backend/models/**/*.py
---

# 🗄️ AISTRALE Database Migration Standards

**⚠️ CRITICAL**: All database schema changes MUST be done through Alembic migrations. Never modify the database schema directly.

## BuildWorks-07001 Alembic Configuration

### Current Setup
- **Migration Tool**: Alembic
- **Migration Location**: `backend/alembic/versions/`
- **Config File**: `backend/alembic.ini`
- **Environment**: `backend/alembic/env.py`

### Alembic Configuration
```python
# ✅ GOOD: Alembic env.py configuration
# backend/alembic/env.py
from logging.config import fileConfig
from sqlmodel import SQLModel
from alembic import context
from core.config import get_settings
from core.database import engine
from models import user, token, telemetry  # Import all models

settings = get_settings()
config = context.config

# Set SQLModel metadata
target_metadata = SQLModel.metadata

def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode."""
    url = settings.DATABASE_URL
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()

def run_migrations_online() -> None:
    """Run migrations in 'online' mode."""
    connectable = engine

    with connectable.connect() as connection:
        context.configure(
            connection=connection, target_metadata=target_metadata
        )

        with context.begin_transaction():
            context.run_migrations()

if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
```

## BuildWorks-07002 Creating Migrations

### Auto-generate Migration
```bash
# ✅ GOOD: Create migration from model changes
cd backend
alembic revision --autogenerate -m "add_user_table"
```

### Manual Migration
```bash
# ✅ GOOD: Create empty migration for data migrations
cd backend
alembic revision -m "migrate_user_data"
```

### Migration File Structure
```python
# ✅ GOOD: Migration file structure
"""add_user_table

Revision ID: abc123
Revises: xyz789
Create Date: 2024-01-01 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers
revision = 'abc123'
down_revision = 'xyz789'
branch_labels = None
depends_on = None

def upgrade() -> None:
    """Apply migration."""
    op.create_table(
        'users',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('email', sa.String(), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('hashed_password', sa.String(), nullable=False),
        sa.Column('role', sa.String(), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_users_email'), 'users', ['email'], unique=True)

def downgrade() -> None:
    """Rollback migration."""
    op.drop_index(op.f('ix_users_email'), table_name='users')
    op.drop_table('users')
```

## BuildWorks-07003 Migration Best Practices

### Do's
- ✅ Always review auto-generated migrations before applying
- ✅ Test migrations on development database first
- ✅ Keep migrations small and focused
- ✅ Include both upgrade and downgrade functions
- ✅ Use descriptive migration messages
- ✅ Test rollback procedures
- ✅ Document complex migrations

### Don'ts
- ❌ Don't modify existing migrations after they've been applied
- ❌ Don't delete migration files
- ❌ Don't create migrations that break existing data
- ❌ Don't skip migration reviews
- ❌ Don't run migrations directly on production without testing

## BuildWorks-07004 Running Migrations

### Development
```bash
# Apply all pending migrations
cd backend
alembic upgrade head

# Apply specific migration
alembic upgrade abc123

# Rollback one migration
alembic downgrade -1

# Rollback to specific revision
alembic downgrade xyz789
```

### Production
```bash
# ✅ GOOD: Production migration workflow
# 1. Backup database
pg_dump -h db -U user huggingface_db > backup.sql

# 2. Test migration on staging
alembic upgrade head

# 3. Apply to production
alembic upgrade head

# 4. Verify migration
alembic current
```

## BuildWorks-07005 Data Migrations

### Migrating Data
```python
# ✅ GOOD: Data migration pattern
"""migrate_user_roles

Revision ID: def456
Revises: abc123
Create Date: 2024-01-02 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

revision = 'def456'
down_revision = 'abc123'
branch_labels = None
depends_on = None

def upgrade() -> None:
    """Migrate user roles."""
    # Schema change
    op.add_column('users', sa.Column('role', sa.String(), nullable=True))
    
    # Data migration
    connection = op.get_bind()
    connection.execute(
        sa.text("UPDATE users SET role = 'user' WHERE role IS NULL")
    )
    
    # Make column non-nullable after data migration
    op.alter_column('users', 'role', nullable=False)

def downgrade() -> None:
    """Rollback user roles."""
    op.drop_column('users', 'role')
```

## BuildWorks-07006 Migration History

### Check Migration Status
```bash
# Check current migration
alembic current

# Show migration history
alembic history

# Show pending migrations
alembic heads
```

## BuildWorks-07007 CI/CD Integration

### Automated Migrations
```yaml
# ✅ GOOD: CI/CD migration check
# .github/workflows/migrations.yml
name: Database Migrations

on: [push, pull_request]

jobs:
  check-migrations:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-python@v4
        with:
          python-version: '3.11'
      - name: Install dependencies
        run: |
          cd backend
          pip install -e .
      - name: Check migrations
        run: |
          cd backend
          alembic check
      - name: Test migrations
        run: |
          cd backend
          alembic upgrade head
          alembic downgrade -1
          alembic upgrade head
```

## BuildWorks-07008 Migration Troubleshooting

### Common Issues

**Issue**: Migration conflicts
```bash
# Resolve by creating merge migration
alembic merge -m "merge_branches" head1 head2
```

**Issue**: Migration fails
```bash
# Check current state
alembic current

# Manually fix and continue
alembic stamp <revision>
alembic upgrade head
```

**Issue**: Need to reset migrations
```bash
# ⚠️ DANGER: Only in development
# Drop all tables and recreate
alembic downgrade base
alembic upgrade head
```

## BuildWorks-07009 Model Changes Workflow

### Adding New Model
1. Create model in `backend/models/`
2. Import model in `backend/models/__init__.py`
3. Import model in `backend/alembic/env.py`
4. Generate migration: `alembic revision --autogenerate -m "add_model_name"`
5. Review migration file
6. Test migration: `alembic upgrade head`
7. Test rollback: `alembic downgrade -1`

### Modifying Existing Model
1. Modify model in `backend/models/`
2. Generate migration: `alembic revision --autogenerate -m "modify_model_name"`
3. Review and adjust migration if needed
4. Test migration and rollback

---

**Next Steps**: 
- Create migration: `alembic revision --autogenerate -m "description"`
- Apply migration: `alembic upgrade head`
- Review `00-core-principles.mdc` for architectural principles
