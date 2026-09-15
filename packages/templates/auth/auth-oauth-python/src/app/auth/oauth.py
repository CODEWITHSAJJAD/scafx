import os
from authlib.integrations.starlette_client import OAuth
from starlette.config import Config

config = Config(environ=os.environ)
oauth = OAuth(config)

oauth.register(
    name='google',
    client_id=os.getenv('GOOGLE_CLIENT_ID', 'your-client-id'),
    client_secret=os.getenv('GOOGLE_CLIENT_SECRET', 'your-client-secret'),
    server_metadata_url='https://accounts.google.com/.well-known/openid-configuration',
    client_kwargs={'scope': 'openid email profile'},
)
