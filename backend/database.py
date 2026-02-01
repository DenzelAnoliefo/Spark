import os
from dotenv import load_dotenv
from sqlmodel import create_engine, Session

load_dotenv()

# 1. Supabase connection string — set in .env, never commit real credentials
# format: postgresql://postgres:[PASSWORD]@host:5432/postgres
DATABASE_URL = os.environ.get("DATABASE_URL")
if not DATABASE_URL:
    raise ValueError(
        "DATABASE_URL environment variable is required. "
        "Copy backend/.env.example to backend/.env and set your connection string."
    )

# 2. Create the Engine
engine = create_engine(DATABASE_URL, echo=True)  # echo=True prints SQL to console for debugging

# 3. Dependency for FastAPI
def get_session():
    with Session(engine) as session:
        yield session