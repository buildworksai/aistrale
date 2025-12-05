from sqlmodel import Session, text

from core.database import engine


def migrate():
    with Session(engine) as session:
        try:
            # Create chatmessage table
            session.exec(
                text("""
                CREATE TABLE IF NOT EXISTS chatmessage (
                    id SERIAL PRIMARY KEY,
                    user_id INTEGER NOT NULL,
                    role VARCHAR NOT NULL,
                    content TEXT NOT NULL,
                    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT (
                        now() at time zone 'utc'
                    ),
                    FOREIGN KEY (user_id) REFERENCES "user" (id)
                )
            """)
            )
            session.commit()
            print("Migration successful: Created chatmessage table.")
        except Exception as e:
            print(f"Migration failed: {e}")


if __name__ == "__main__":
    migrate()
