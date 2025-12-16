from sqlmodel import Session, text

from core.database import engine


def migrate():
    with Session(engine) as session:
        session.exec(
            text("ALTER TABLE telemetry ADD COLUMN IF NOT EXISTS input_tokens INTEGER;"))
        session.exec(
            text(
                "ALTER TABLE telemetry ADD COLUMN IF NOT EXISTS output_tokens INTEGER;"
            )
        )
        session.commit()


if __name__ == "__main__":
    migrate()
