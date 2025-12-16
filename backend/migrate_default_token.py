from sqlmodel import Session, text

from core.database import engine


def migrate():
    with Session(engine) as session:
        try:
            session.exec(
                text("ALTER TABLE token ADD COLUMN is_default BOOLEAN DEFAULT FALSE"))
            session.commit()
            print("Migration successful: Added is_default column to token table.")
        except Exception as e:
            print(f"Migration failed (might already exist): {e}")


if __name__ == "__main__":
    migrate()
