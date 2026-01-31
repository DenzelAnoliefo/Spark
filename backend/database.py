from sqlmodel import create_engine, Session

# 1. Your Supabase Connection String
# format: postgresql://postgres:[PASSWORD]@host:5432/postgres
DATABASE_URL = "postgresql://postgres:DenzelAnoliefo#04@pqjbxcsjddsbiseobswc.supabase.co:5432/postgres"

# 2. Create the Engine
engine = create_engine(DATABASE_URL, echo=True) # echo=True prints SQL to console for debugging

# 3. Dependency for FastAPI
def get_session():
    with Session(engine) as session:
        yield session