import paramiko
import threading
import socket
import select
from sqlmodel import SQLModel, Session, create_engine
from app import config

# SSH Tunnel Implementation
def forward_tunnel(local_port, remote_host, remote_port, transport):
    """
    Start a local socket server and forward incoming connections to the remote database
    through the SSH transport.
    """
    server_sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    server_sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
    server_sock.bind(("127.0.0.1", local_port))
    server_sock.listen(100)

    while True:
        client_sock, addr = server_sock.accept()
        chan = transport.open_channel(
            "direct-tcpip",
            (remote_host, remote_port),
            client_sock.getsockname()
        )

        threading.Thread(
            target=handle_connection,
            args=(client_sock, chan),
            daemon=True
        ).start()

def handle_connection(client_sock, chan):
    """
    Handle bi-directional data transfer between the local client socket and remote channel.
    """
    try:
        while True:
            r, _, _ = select.select([client_sock, chan], [], [])
            if client_sock in r:
                data = client_sock.recv(1024)
                if not data:
                    break
                chan.send(data)
            if chan in r:
                data = chan.recv(1024)
                if not data:
                    break
                client_sock.send(data)
    finally:
        chan.close()
        client_sock.close()

def start_ssh_tunnel():
    """
    Set up an SSH client using the provided key and start the tunnel in a background thread.
    """
    key = paramiko.RSAKey.from_private_key_file(config.SSH_KEY_PATH)
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(
        hostname=config.SSH_HOST,
        port=config.SSH_PORT,
        username=config.SSH_USER,
        pkey=key
    )
    transport = client.get_transport()
    threading.Thread(
        target=forward_tunnel,
        args=(config.LOCAL_PORT, config.REMOTE_DB_HOST, config.REMOTE_DB_PORT, transport),
        daemon=True
    ).start()

# SQLModel Database Setup
# Connect to the forwarded local port as if it's a local MySQL database
DATABASE_URL = (
    f"mysql+mysqlconnector://{config.DB_USER}:{config.DB_PASS}"
    f"@127.0.0.1:{config.LOCAL_PORT}/{config.DB_NAME}"
)
engine = create_engine(DATABASE_URL, echo=True)

def init_db():
    """
    Create all database tables defined in SQLModel models.
    """
    SQLModel.metadata.create_all(engine)

def get_session():
    """
    Return a new SQLModel session bound to the database engine.
    """
    return Session(engine)