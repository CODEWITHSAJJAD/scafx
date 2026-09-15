from app.models.user_model import UserModel

class UserView:
    @staticmethod
    def render_profile(user: UserModel) -> dict:
        return {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "joined": user.created_at.isoformat()
        }
