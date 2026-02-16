import pymysql
from app.core.config import settings
from app.core.logger import logger

def get_db_connection(db_name: str = None):
    """
    Get a connection to the MySQL database.
    If db_name is not provided, uses the default database from settings.
    """
    if db_name is None:
        db_name = settings.DB_NAME
        
    return pymysql.connect(
        host=settings.DB_HOST,
        port=settings.DB_PORT,
        user=settings.DB_USER,
        password=settings.DB_PASSWORD,
        database=db_name,
        charset='utf8mb4',
        cursorclass=pymysql.cursors.DictCursor
    )
