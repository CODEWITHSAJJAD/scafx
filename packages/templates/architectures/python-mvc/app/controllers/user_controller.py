from app.models.user_model import UserModel
from app.views.user_view import UserView

class UserController:
    def __init__(self):
        self.mock_user = UserModel(id="1", username="dev_user", email="dev@{{projectName}}.local")

    def show_profile(self):
        return UserView.render_profile(self.mock_user)

user_controller = UserController()
