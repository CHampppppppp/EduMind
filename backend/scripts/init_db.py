import pymysql
import sys
import os

# Add the parent directory to sys.path to allow importing app
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.config import settings
from app.core.logger import logger

# Database configuration from settings
DB_HOST = settings.DB_HOST
DB_PORT = settings.DB_PORT
DB_USER = settings.DB_USER
DB_PASSWORD = settings.DB_PASSWORD
DB_NAME = settings.DB_NAME

def get_connection(db_name=None):
    return pymysql.connect(
        host=DB_HOST,
        port=DB_PORT,
        user=DB_USER,
        password=DB_PASSWORD,
        database=db_name,
        charset='utf8mb4',
        cursorclass=pymysql.cursors.DictCursor
    )

def create_database():
    logger.info(f"Connecting to MySQL at {DB_HOST}:{DB_PORT}...")
    try:
        conn = pymysql.connect(
            host=DB_HOST,
            port=DB_PORT,
            user=DB_USER,
            password=DB_PASSWORD,
            charset='utf8mb4'
        )
        cursor = conn.cursor()
        logger.info(f"Creating database '{DB_NAME}' if not exists...")
        cursor.execute(f"CREATE DATABASE IF NOT EXISTS {DB_NAME} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci")
        conn.commit()
        conn.close()
        logger.info(f"Database '{DB_NAME}' created or already exists.")
    except Exception as e:
        logger.error(f"Error creating database: {e}")
        sys.exit(1)

def create_tables():
    logger.info(f"Connecting to database '{DB_NAME}'...")
    try:
        conn = get_connection(DB_NAME)
        cursor = conn.cursor()

        # Table: users
        logger.info("Creating table 'users'...")
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id VARCHAR(36) PRIMARY KEY,
                username VARCHAR(255) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                avatar_url VARCHAR(512),
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        """)

        # Table: knowledge_base
        print("Creating table 'knowledge_base'...")
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS knowledge_base (
                id VARCHAR(36) PRIMARY KEY,
                user_id VARCHAR(36) NOT NULL,
                title VARCHAR(255) NOT NULL,
                type VARCHAR(50) NOT NULL,
                url VARCHAR(512) NOT NULL,
                status VARCHAR(50) DEFAULT 'pending',
                summary TEXT,
                upload_date DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        """)

        # Table: chats
        print("Creating table 'chats'...")
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS chats (
                id VARCHAR(36) PRIMARY KEY,
                user_id VARCHAR(36) NOT NULL,
                title VARCHAR(255),
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        """)

        # Table: messages
        print("Creating table 'messages'...")
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS messages (
                id VARCHAR(36) PRIMARY KEY,
                chat_id VARCHAR(36) NOT NULL,
                role VARCHAR(20) NOT NULL,
                content LONGTEXT NOT NULL,
                model VARCHAR(50),
                thinking TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (chat_id) REFERENCES chats(id) ON DELETE CASCADE
            )
        """)

        # Table: analysis_results
        print("Creating table 'analysis_results'...")
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS analysis_results (
                id VARCHAR(36) PRIMARY KEY,
                user_id VARCHAR(36) NOT NULL,
                topic VARCHAR(255) NOT NULL,
                audience VARCHAR(255),
                duration INT,
                style VARCHAR(100),
                structure JSON,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        """)

        # Table: generated_contents
        print("Creating table 'generated_contents'...")
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS generated_contents (
                id VARCHAR(36) PRIMARY KEY,
                analysis_id VARCHAR(36) NOT NULL,
                slides JSON,
                lesson_plan LONGTEXT,
                games JSON,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (analysis_id) REFERENCES analysis_results(id) ON DELETE CASCADE
            )
        """)

        conn.commit()
        conn.close()
        print("All tables created successfully.")

    except Exception as e:
        print(f"Error creating tables: {e}")
        sys.exit(1)

if __name__ == "__main__":
    create_database()
    create_tables()
