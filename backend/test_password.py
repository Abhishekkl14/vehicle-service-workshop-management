from app.core.security import verify_password

hashed = "$2b$12$e4ml1r7agOAqbPJ4rRBCzOvapg0LRVuS63sZX8ITe7L3HOFpOlvcO"

print(verify_password("password", hashed))