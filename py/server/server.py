from flask import Flask
from flask_cors import CORS
import argparse

from api import api



def create_app(config=None):
    """Create and configure an instance of the Flask application."""
    app = Flask(__name__)
    CORS(app)

    @app.route('/hello')
    def hello():
        return 'Hello, World!'

    app.register_blueprint(api, url_prefix='/api')
    # app.register_blueprint(vis, url_prefix='/')

    return app


def add_arguments_server(parser):
    parser.add_argument('--run-per-partition', default=False, action='store_true',
                        help='if set, generate a new datarun for each hyperpartition')

    # API flags
    parser.add_argument('--host', default='0.0.0.0', help='Port in which to run the API')
    parser.add_argument('--port', default=7777, help='Port in which to run the API')
    parser.add_argument('--debug', action="store_const", default=False, const=True,
                        help='If true, run Flask in debug mode')


def start_server():
    parser = argparse.ArgumentParser()

    # API flags
    parser.add_argument('--host', default='0.0.0.0', help='host address')
    parser.add_argument('--port', default=7777, help='Port in which to run the API')
    parser.add_argument('--debug', action="store_const", default=True, const=True,
                        help='If true, run Flask in debug mode')


    args = parser.parse_args()
    app = create_app(vars(args))

    app.run(
        debug=args.debug,
        host=args.host,
        port=int(args.port)
    )


if __name__ == '__main__':
    start_server()