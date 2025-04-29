import logging
import os
from dotenv import load_dotenv
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup, WebAppInfo # Added imports
from telegram.ext import Application, CommandHandler, MessageHandler, filters, ContextTypes

# --- Environment Variables & Logging ---
load_dotenv() # Load variables from .env file

TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN")
# --- Get NGROK URL (Replace this manually for now) ---
# IMPORTANT: Replace this with the ACTUAL https URL from your running ngrok instance!
# In a real deployment, you wouldn't hardcode this.
NGROK_URL = "https://a88f-134-6-156-202.ngrok-free.app"

if not TELEGRAM_BOT_TOKEN:
    raise ValueError("TELEGRAM_BOT_TOKEN not found in .env file")


# Enable logging (helps with debugging)
logging.basicConfig(
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s", level=logging.INFO
)
logging.getLogger("httpx").setLevel(logging.WARNING) # Quieter HTTP logs
logger = logging.getLogger(__name__)

# --- Placeholder Functions (To be implemented) ---

async def analyze_message_helpfulness(message_text: str) -> bool:
    """
    Placeholder function to analyze message helpfulness using an LLM.
    Returns True if helpful, False otherwise.
    """
    logger.info(f"Placeholder: Analyzing message: '{message_text[:50]}...'")
    # TODO: Implement actual LLM API call here
    # Example: Based on keywords for now
    keywords = ["how to", "can you help", "explain", "resource", "link"]
    if any(keyword in message_text.lower() for keyword in keywords):
         logger.info("Placeholder: Classified as potentially helpful.")
         return True
    return False

async def award_aura_points(user_id: int, points: int):
    """
    Placeholder function to award Aura points to a user in the database.
    """
    logger.info(f"Placeholder: Awarding {points} points to user {user_id}")
    # TODO: Implement database update logic here (e.g., using SQLite or another DB)
    pass

async def get_aura_points(user_id: int) -> int:
    """
    Placeholder function to retrieve Aura points for a user from the database.
    """
    logger.info(f"Placeholder: Getting points for user {user_id}")
    # TODO: Implement database query logic here
    # Example: Return a dummy value for now
    return 123 # Dummy value

# --- Bot Handlers ---

async def start(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Sends explanation on /start"""
    await update.message.reply_text("Hi! I analyze messages to award Aura points for helpful contributions. Use /show_aura to see your balance.")

async def handle_message(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Handles regular messages, analyzes helpfulness, and awards points."""
    message = update.message
    user = message.from_user
    message_text = message.text

    if not user or not message_text or message.chat.type == 'private': # Don't process private messages here
         # Only process messages in groups/supergroups for helpfulness analysis
        if message.chat.type != 'private':
             logger.info(f"Ignoring message from {user.username} in chat type {message.chat.type}")
        return


    logger.info(f"Received group message from {user.username} (ID: {user.id}): '{message_text[:50]}...'")

    # Analyze message using LLM (placeholder)
    try:
        is_helpful = await analyze_message_helpfulness(message_text)

        if is_helpful:
            points_to_award = 5 # Example: Award 5 points for a helpful message
            await award_aura_points(user.id, points_to_award)
            # Optionally notify the user (might be too noisy in groups)
            # await message.reply_text(f"Thanks for the helpful contribution! +{points_to_award} Aura points.", quote=True)
            logger.info(f"Awarded {points_to_award} points to {user.username} (ID: {user.id}) for helpful message.")

    except Exception as e:
        logger.error(f"Error processing message from {user.username}: {e}", exc_info=True)


async def check_aura_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Handles the /check_aura command (simple text reply)."""
    user = update.message.from_user
    if not user:
        return

    try:
        points = await get_aura_points(user.id)
        await update.message.reply_text(f"Hi {user.first_name}, you currently have {points} Aura points. Use /show_aura for a detailed view.")
    except Exception as e:
        logger.error(f"Error fetching points for {user.username}: {e}", exc_info=True)
        await update.message.reply_text("Sorry, I couldn't fetch your points right now.")

# --- NEW: Handler for Web App ---
async def show_aura_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Sends a button to open the Aura points Web App."""
    user = update.message.from_user
    if not user:
        return

    # Create the button that opens the Web App
    # The URL MUST be the HTTPS ngrok URL pointing to your local web server
    keyboard = [
        [InlineKeyboardButton("📊 Show My Aura Points", web_app=WebAppInfo(url=NGROK_URL))]
    ]
    reply_markup = InlineKeyboardMarkup(keyboard)

    await update.message.reply_text(
        "Click the button below to see your Aura points:",
        reply_markup=reply_markup
    )


# --- Main Bot Execution ---

def main() -> None:
    """Start the bot."""
    application = Application.builder().token(TELEGRAM_BOT_TOKEN).build()

    # Register handlers
    application.add_handler(CommandHandler("start", start))
    application.add_handler(CommandHandler("check_aura", check_aura_command))
    application.add_handler(CommandHandler("show_aura", show_aura_command)) # Add new command handler
    # Handle non-command text messages ONLY in groups/supergroups
    application.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND & (filters.ChatType.GROUPS | filters.ChatType.SUPERGROUP), handle_message))


    logger.info("Starting bot...")
    application.run_polling()

if __name__ == "__main__":
    main() 