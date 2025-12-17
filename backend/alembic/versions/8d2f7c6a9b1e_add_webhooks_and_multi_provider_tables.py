"""add webhooks and multi-provider tables

Revision ID: 8d2f7c6a9b1e
Revises: c3a1b8e2d9f0
Create Date: 2025-12-17 10:46:00.000000

"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "8d2f7c6a9b1e"
down_revision: str | Sequence[str] | None = "c3a1b8e2d9f0"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    tables = set(inspector.get_table_names())

    if "webhook" not in tables:
        op.create_table(
            "webhook",
            sa.Column("id", sa.Integer(), nullable=False),
            sa.Column("workspace_id", sa.Integer(), nullable=False),
            sa.Column("url", sa.String(), nullable=False),
            sa.Column(
                "events",
                sa.JSON(),
                nullable=False,
                server_default=sa.text("'[]'::json"),
            ),
            sa.Column("secret", sa.String(), nullable=False),
            sa.Column("enabled", sa.Boolean(), nullable=False, server_default=sa.text("true")),
            sa.Column(
                "created_at",
                sa.DateTime(timezone=True),
                nullable=False,
                server_default=sa.text("(now() AT TIME ZONE 'utc'::text)"),
            ),
            sa.ForeignKeyConstraint(["workspace_id"], ["workspace.id"]),
            sa.PrimaryKeyConstraint("id"),
        )
        op.create_index(op.f("ix_webhook_workspace_id"), "webhook", ["workspace_id"], unique=False)

    if "webhookdelivery" not in tables:
        op.create_table(
            "webhookdelivery",
            sa.Column("id", sa.Integer(), nullable=False),
            sa.Column("webhook_id", sa.Integer(), nullable=False),
            sa.Column("event_type", sa.String(), nullable=False),
            sa.Column(
                "payload",
                sa.JSON(),
                nullable=False,
                server_default=sa.text("'{}'::json"),
            ),
            sa.Column("status", sa.String(), nullable=False),
            sa.Column("response_code", sa.Integer(), nullable=True),
            sa.Column("delivered_at", sa.DateTime(timezone=True), nullable=True),
            sa.Column(
                "created_at",
                sa.DateTime(timezone=True),
                nullable=False,
                server_default=sa.text("(now() AT TIME ZONE 'utc'::text)"),
            ),
            sa.ForeignKeyConstraint(["webhook_id"], ["webhook.id"]),
            sa.PrimaryKeyConstraint("id"),
        )
        op.create_index(op.f("ix_webhookdelivery_status"), "webhookdelivery", ["status"], unique=False)

    if "providerhealth" not in tables:
        op.create_table(
            "providerhealth",
            sa.Column("id", sa.Integer(), nullable=False),
            sa.Column("provider", sa.String(), nullable=False),
            sa.Column("status", sa.String(), nullable=False),
            sa.Column("avg_latency_ms", sa.Float(), nullable=False, server_default=sa.text("0")),
            sa.Column("error_rate", sa.Float(), nullable=False, server_default=sa.text("0")),
            sa.Column("uptime_percentage", sa.Float(), nullable=False, server_default=sa.text("100")),
            sa.Column(
                "last_check",
                sa.DateTime(timezone=True),
                nullable=False,
                server_default=sa.text("(now() AT TIME ZONE 'utc'::text)"),
            ),
            sa.PrimaryKeyConstraint("id"),
        )
        op.create_index(op.f("ix_providerhealth_provider"), "providerhealth", ["provider"], unique=False)
        op.create_index(op.f("ix_providerhealth_status"), "providerhealth", ["status"], unique=False)

    if "failoverconfig" not in tables:
        op.create_table(
            "failoverconfig",
            sa.Column("id", sa.Integer(), nullable=False),
            sa.Column("workspace_id", sa.Integer(), nullable=False),
            sa.Column("primary_provider", sa.String(), nullable=False),
            sa.Column(
                "fallback_providers",
                sa.JSON(),
                nullable=False,
                server_default=sa.text("'[]'::json"),
            ),
            sa.Column(
                "failover_conditions",
                sa.JSON(),
                nullable=False,
                server_default=sa.text("'{}'::json"),
            ),
            sa.Column("enabled", sa.Boolean(), nullable=False, server_default=sa.text("true")),
            sa.ForeignKeyConstraint(["workspace_id"], ["workspace.id"]),
            sa.PrimaryKeyConstraint("id"),
        )
        op.create_index(op.f("ix_failoverconfig_workspace_id"), "failoverconfig", ["workspace_id"], unique=False)

    if "providercomparison" not in tables:
        op.create_table(
            "providercomparison",
            sa.Column("id", sa.Integer(), nullable=False),
            sa.Column("comparison_date", sa.Date(), nullable=False),
            sa.Column("provider1", sa.String(), nullable=False),
            sa.Column("provider2", sa.String(), nullable=False),
            sa.Column("metric", sa.String(), nullable=False),
            sa.Column("provider1_value", sa.Float(), nullable=False),
            sa.Column("provider2_value", sa.Float(), nullable=False),
            sa.Column("winner", sa.String(), nullable=False),
            sa.PrimaryKeyConstraint("id"),
        )

    if "abtest" not in tables:
        op.create_table(
            "abtest",
            sa.Column("id", sa.Integer(), nullable=False),
            sa.Column("name", sa.String(), nullable=False),
            sa.Column("prompt", sa.Text(), nullable=False),
            sa.Column(
                "providers",
                sa.JSON(),
                nullable=False,
                server_default=sa.text("'[]'::json"),
            ),
            sa.Column("status", sa.String(), nullable=False, server_default=sa.text("'running'")),
            sa.Column(
                "created_at",
                sa.DateTime(timezone=True),
                nullable=False,
                server_default=sa.text("(now() AT TIME ZONE 'utc'::text)"),
            ),
            sa.PrimaryKeyConstraint("id"),
        )

    if "abtestresult" not in tables:
        op.create_table(
            "abtestresult",
            sa.Column("id", sa.Integer(), nullable=False),
            sa.Column("ab_test_id", sa.Integer(), nullable=False),
            sa.Column("provider", sa.String(), nullable=False),
            sa.Column("response", sa.Text(), nullable=False),
            sa.Column("latency_ms", sa.Float(), nullable=False),
            sa.Column("cost", sa.Float(), nullable=False),
            sa.Column("quality_score", sa.Float(), nullable=False, server_default=sa.text("0")),
            sa.ForeignKeyConstraint(["ab_test_id"], ["abtest.id"]),
            sa.PrimaryKeyConstraint("id"),
        )

    if "modelmapping" not in tables:
        op.create_table(
            "modelmapping",
            sa.Column("id", sa.Integer(), nullable=False),
            sa.Column("model_name", sa.String(), nullable=False),
            sa.Column("provider", sa.String(), nullable=False),
            sa.Column(
                "equivalent_models",
                sa.JSON(),
                nullable=False,
                server_default=sa.text("'[]'::json"),
            ),
            sa.Column(
                "capabilities",
                sa.JSON(),
                nullable=False,
                server_default=sa.text("'{}'::json"),
            ),
            sa.Column(
                "pricing",
                sa.JSON(),
                nullable=False,
                server_default=sa.text("'{}'::json"),
            ),
            sa.PrimaryKeyConstraint("id"),
        )
        op.create_index(op.f("ix_modelmapping_model_name"), "modelmapping", ["model_name"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_modelmapping_model_name"), table_name="modelmapping")
    op.drop_table("modelmapping")

    op.drop_table("abtestresult")
    op.drop_table("abtest")

    op.drop_table("providercomparison")

    op.drop_index(op.f("ix_failoverconfig_workspace_id"), table_name="failoverconfig")
    op.drop_table("failoverconfig")

    op.drop_index(op.f("ix_providerhealth_status"), table_name="providerhealth")
    op.drop_index(op.f("ix_providerhealth_provider"), table_name="providerhealth")
    op.drop_table("providerhealth")

    op.drop_index(op.f("ix_webhookdelivery_status"), table_name="webhookdelivery")
    op.drop_table("webhookdelivery")

    op.drop_index(op.f("ix_webhook_workspace_id"), table_name="webhook")
    op.drop_table("webhook")
