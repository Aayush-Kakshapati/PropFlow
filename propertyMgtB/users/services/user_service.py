from users.models import User

def create_user(username, email, password, role):
    user = User.objects.create_user(
        username= username,
        email= email,
        password= password,
        role= role
    )

    return user