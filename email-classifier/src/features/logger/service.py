import logging
import sys

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - [%(levelname)s] - %(message)s",
    handlers=[
        logging.FileHandler("app.log"), 
        logging.StreamHandler(sys.stdout) 
    ]
)

class LogService:
    """Serviço centralizado para gerenciamento de logs da aplicação."""
    
    @staticmethod
    def info(message: str):
        logging.info(message)

    @staticmethod
    def error(message: str):
        logging.error(message)

    @staticmethod
    def warning(message: str):
        logging.warning(message)